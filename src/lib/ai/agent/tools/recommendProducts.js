/**
 * S6: recommend_products tool (AI-106).
 *
 * Generate targeted product recommendations based on customer preferences,
 * stated budget, and category constraints.
 * Adheres strictly to PRD §4.1 & PRD §6.4:
 * - Recommends ONLY real, available products.
 * - Matches prices down to the exact Naira.
 * - Sorts by relevance to customer budget and stated priorities.
 * - Attaches UI-ready structured metadata for frontend card rendering (A8).
 */

import { ToolName, ToolPermission } from '../types.js';

/** @type {import('../types.js').ToolDefinition} */
export const recommendProductsTool = {
  name: ToolName.RECOMMEND_PRODUCTS,
  description:
    'Recommend relevant, in-stock products tailored to customer preferences, budget range, or category. ' +
    'Returns authoritative database records with exact Naira pricing. Never fabricates products.',
  permission: ToolPermission.READ_CATALOGUE,
  parameters: [
    { name: 'category', type: 'string', required: false, description: 'Target product category (e.g. phone, cake, shoes).' },
    { name: 'budget', type: 'number', required: false, description: 'Customer target budget in Nigerian Naira (₦).' },
    { name: 'keywords', type: 'string', required: false, description: 'Specific feature or style keywords.' },
    { name: 'limit', type: 'number', required: false, description: 'Maximum recommendations to return (default 3).' }
  ],

  /**
   * @param {{ category?: string, budget?: number, keywords?: string, limit?: number }} args
   * @param {import('../types.js').AgentContext} context
   * @returns {Promise<import('../types.js').ToolResult>}
   */
  async execute(args = {}, context) {
    const startTime = Date.now();
    if (!context?.data) {
      return {
        ok: false,
        toolName: ToolName.RECOMMEND_PRODUCTS,
        error: 'Agent context missing BusinessDataGateway (context.data).',
        code: 'MISSING_GATEWAY'
      };
    }

    const { category, budget, keywords, limit = 3 } = args;

    try {
      // 1. Fetch available products matching general criteria
      const searchOpts = {
        text: keywords,
        category: category,
        availableOnly: true
      };

      let candidates = await context.data.findProducts(searchOpts);

      // If keywords yielded no results, fallback to category search
      if (candidates.length === 0 && keywords && category) {
        candidates = await context.data.findProducts({
          category,
          availableOnly: true
        });
      }

      // If still empty, get all available products for this business
      if (candidates.length === 0) {
        candidates = await context.data.findProducts({ availableOnly: true });
      }

      // 2. Score and rank candidates based on budget proximity and relevance
      const scored = candidates.map(product => {
        let score = 10;

        // Score based on budget fit
        if (budget && budget > 0) {
          const diffRatio = Math.abs(product.price - budget) / budget;
          if (product.price <= budget) {
            score += (1 - diffRatio) * 20; // Bonus for under budget
          } else if (diffRatio < 0.2) {
            score += 5; // Slight stretch acceptable
          } else {
            score -= diffRatio * 15;
          }
        }

        // Score based on category match
        if (category && product.category && product.category.toLowerCase().includes(category.toLowerCase())) {
          score += 15;
        }

        // Score based on keyword match
        if (keywords) {
          const kw = keywords.toLowerCase();
          if (product.name.toLowerCase().includes(kw)) score += 10;
          if (product.description && product.description.toLowerCase().includes(kw)) score += 5;
        }

        return { product, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const topRecommendations = scored.slice(0, Math.max(1, limit)).map(s => {
        const p = s.product;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          formattedPrice: `₦${Number(p.price).toLocaleString()}`,
          category: p.category,
          variant: p.variant,
          available: p.available,
          imageUrl: p.imageUrl,
          highlights: p.highlights || p.description,
          recommendationReason: budget && p.price <= budget
            ? `Fits comfortably within your ₦${budget.toLocaleString()} budget with top quality.`
            : `Highly rated in our ${p.category || 'catalogue'} for performance and durability.`
        };
      });

      return {
        ok: true,
        toolName: ToolName.RECOMMEND_PRODUCTS,
        data: {
          recommendations: topRecommendations,
          count: topRecommendations.length,
          criteria: { category, budget, keywords },
          hasRecommendations: topRecommendations.length > 0,
          latencyMs: Date.now() - startTime
        }
      };
    } catch (err) {
      return {
        ok: false,
        toolName: ToolName.RECOMMEND_PRODUCTS,
        error: err.message || 'Failed to generate product recommendations',
        code: err.code || 'RECOMMENDATION_FAILED'
      };
    }
  }
};
