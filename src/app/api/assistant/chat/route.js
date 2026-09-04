/**
 * S4: Assistant Chat API Route (/api/assistant/chat).
 *
 * Implements conversational endpoint supporting:
 * - Streaming response envelopes (Server-Sent Events)
 * - Structured JSON response envelopes
 * - Intent routing & human handoff detection
 * - Latency optimization (< 1.5s first token)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createConversationEngine } from '@/lib/ai/agent/conversationEngine';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      businessId,
      conversationId: providedConversationId,
      customerId,
      customerName,
      contact,
      message,
      stream = false
    } = body;

    const rawCustomerName = typeof customerName === 'string' ? customerName.trim() : '';
    const isGuest = !rawCustomerName || rawCustomerName.toLowerCase() === 'customer' || rawCustomerName.toLowerCase() === 'guest';
    const finalCustomerName = isGuest ? null : rawCustomerName;

    const rawContact = typeof contact === 'string' ? contact.trim() : '';
    const isEmail = rawContact.includes('@');

    // 1. Validate required inputs
    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'businessId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 2. Resolve or create Conversation Record
    let conversationId = providedConversationId;
    let resolvedCustomerId = customerId;

    if (!conversationId) {
      // Create new conversation in DB if prisma is accessible
      try {
        if (prisma?.conversation?.create) {
          // If customerId is not provided, find or create customer
          if (!resolvedCustomerId && prisma?.customer?.create) {
            const customerPayload = {
              businessId,
              channel: 'web_chat',
              ...(finalCustomerName ? { name: finalCustomerName } : {}),
              ...(rawContact ? (isEmail ? { email: rawContact } : { phone: rawContact }) : {}),
            };

            const newCustomer = await prisma.customer.create({
              data: customerPayload,
            });
            resolvedCustomerId = newCustomer.id;
          }

          if (resolvedCustomerId) {
            const newConv = await prisma.conversation.create({
              data: {
                businessId,
                customerId: resolvedCustomerId,
                status: 'active',
                messages: []
              }
            });
            conversationId = newConv.id;
          }
        }
      } catch (dbErr) {
        console.warn('[ChatRoute] DB conversation creation fallback:', dbErr?.message);
      }

      // Fallback ID if DB is not available
      if (!conversationId) {
        conversationId = `conv_${randomUUID()}`;
      }
    } else {
      // If conversation already exists, resolve customerId and update customer if needed
      try {
        if (prisma?.conversation?.findUnique) {
          const existingConv = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { customer: true },
          });

          if (existingConv?.customer) {
            resolvedCustomerId = existingConv.customer.id;
            const updates = {};
            const existingName = existingConv.customer.name?.trim();
            const existingIsGuest = !existingName || existingName.toLowerCase() === 'customer' || existingName.toLowerCase() === 'guest';
            if (finalCustomerName && existingIsGuest) {
              updates.name = finalCustomerName;
            }
            if (rawContact) {
              if (isEmail && !existingConv.customer.email) {
                updates.email = rawContact;
              } else if (!isEmail && !existingConv.customer.phone) {
                updates.phone = rawContact;
              }
            }

            if (Object.keys(updates).length > 0 && prisma?.customer?.update) {
              await prisma.customer.update({
                where: { id: existingConv.customer.id },
                data: updates,
              });
            }
          }
        }
      } catch (updateErr) {
        console.warn('[ChatRoute] DB customer update fallback:', updateErr?.message);
      }
    }

    // 3. Instantiate Scoped Conversation Engine
    const engine = createConversationEngine({
      businessId,
      db: prisma
    });

    // 4. Process the message through the conversation engine
    const result = await engine.processMessage({
      conversationId,
      message
    });

    // 5. Handle Streaming Response
    if (stream) {
      const encoder = new TextEncoder();
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            // Stream message tokens (simulating sub-token streaming / word chunks)
            const words = result.response.split(/(\s+)/);
            for (const word of words) {
              if (!word) continue;
              const chunk = JSON.stringify({
                type: 'token',
                content: word
              });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              // Tiny tick for stream cadence
              await new Promise(r => setTimeout(r, 15));
            }

            // End envelope with metadata
            const finalMeta = JSON.stringify({
              type: 'done',
              conversationId: result.conversationId,
              customerId: resolvedCustomerId || null,
              intent: result.intent,
              handoff: result.handoff,
              latencyMs: Date.now() - startTime
            });
            controller.enqueue(encoder.encode(`data: ${finalMeta}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        }
      });

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        }
      });
    }

    // 6. Return Structured JSON Response Envelope
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      customerId: resolvedCustomerId || null,
      message: {
        role: 'assistant',
        content: result.response
      },
      intent: result.intent,
      handoff: result.handoff,
      latencyMs: Date.now() - startTime
    });

  } catch (err) {
    console.error('[ChatRoute] Internal error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while processing the conversation',
        message: {
          role: 'assistant',
          content: "I'm having a brief issue reaching our store systems. I'll check with the business owner right away."
        },
        latencyMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
