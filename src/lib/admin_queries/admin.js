import { getAdminDb } from '../supabase';

export async function getDashboardStats() {
  const supabase = getAdminDb();
  
  // Total businesses
  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true });

  // Active businesses (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const { data: activeLogs } = await supabase
    .from('usage_logs')
    .select('business_id')
    .gte('created_at', lastWeek.toISOString());
    
  const activeBusinesses = new Set(activeLogs?.map(log => log.business_id)).size;

  // Total cost
  const { data: costData } = await supabase
    .from('usage_logs')
    .select('cost_estimate');
    
  const totalCost = costData?.reduce((sum, log) => sum + Number(log.cost_estimate), 0) || 0;

  // Top 5 businesses by cost
  const { data: allLogs } = await supabase
    .from('usage_logs')
    .select('business_id, cost_estimate, businesses(name, slug)');
    
  const businessCostMap = {};
  allLogs?.forEach(log => {
    if (!businessCostMap[log.business_id]) {
      businessCostMap[log.business_id] = {
        name: log.businesses?.name || 'Unknown',
        cost: 0
      };
    }
    businessCostMap[log.business_id].cost += Number(log.cost_estimate);
  });
  
  const topBusinesses = Object.entries(businessCostMap)
    .map(([id, info]) => ({ id, name: info.name, cost: info.cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return {
    totalBusinesses: totalBusinesses || 0,
    activeBusinesses,
    totalCost,
    topBusinesses
  };
}

export async function getAllBusinesses() {
  const supabase = getAdminDb();
  
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      owner_id,
      created_at,
      status,
      usage_logs (
        cost_estimate
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return [];

  // We need owner emails, which requires joining auth.users via admin client
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const usersMap = {};
  usersData?.users?.forEach(u => {
    usersMap[u.id] = u.email;
  });

  return businesses.map(b => {
    const totalCost = b.usage_logs?.reduce((sum, log) => sum + Number(log.cost_estimate), 0) || 0;
    const totalUsageCount = b.usage_logs?.length || 0;
    
    return {
      ...b,
      owner_email: usersMap[b.owner_id] || 'Unknown',
      totalCost,
      totalUsageCount,
      usage_logs: undefined 
    };
  });
}

export async function getBusinessDetails(id) {
  const supabase = getAdminDb();
  
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, owner_id, status, created_at,
      usage_logs (
        id, type, tokens_used, duration, cost_estimate, created_at
      )
    `)
    .eq('id', id)
    .single();
    
  if (error) return null;

  const { data: userData } = await supabase.auth.admin.getUserById(business.owner_id);
  business.owner_email = userData?.user?.email || 'Unknown';

  let totalLlmTokens = 0, totalSttDuration = 0, totalTtsUsage = 0;
  let llmCost = 0, sttCost = 0, ttsCost = 0, totalCost = 0;
  const dailyStats = {};

  business.usage_logs?.forEach(log => {
    const cost = Number(log.cost_estimate) || 0;
    totalCost += cost;
    
    const dateStr = new Date(log.created_at).toISOString().split('T')[0];
    if (!dailyStats[dateStr]) {
      dailyStats[dateStr] = { date: dateStr, count: 0, cost: 0 };
    }
    dailyStats[dateStr].count += 1;
    dailyStats[dateStr].cost += cost;

    if (log.type === 'llm') {
      totalLlmTokens += log.tokens_used || 0;
      llmCost += cost;
    } else if (log.type === 'stt') {
      totalSttDuration += log.duration || 0;
      sttCost += cost;
    } else if (log.type === 'tts') {
      totalTtsUsage += log.duration || log.tokens_used || 0; 
      ttsCost += cost;
    }
  });

  return {
    ...business,
    stats: {
      totalLlmTokens, totalSttDuration, totalTtsUsage, requestsCount: business.usage_logs?.length || 0,
      totalCost, llmCost, sttCost, ttsCost,
    },
    charts: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date))
  };
}

export async function updateBusinessStatus(id, newStatus) {
  const supabase = getAdminDb();
  const { error } = await supabase
    .from('businesses')
    .update({ status: newStatus })
    .eq('id', id);
  return !error;
}

export async function getPlatformAnalytics() {
  const supabase = getAdminDb();
  
  // Total Conversations
  const { count: totalChats } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true });

  // Active Users (Distinct customers)
  const { count: activeUsers } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true });

  // Usage by Type for AI Handover proxy
  const { data: usageLogs } = await supabase
    .from('usage_logs')
    .select('type');
    
  const llmCount = usageLogs?.filter(log => log.type === 'llm').length || 0;
  const totalLogs = usageLogs?.length || 1;
  const aiHandover = (llmCount / totalLogs) * 100;

  // Monthly progression (last 12 weeks/months proxy)
  // For now, let's just return some structured mock data based on real volumes if possible
  // or simple aggregates. Real time-series would require more complex grouping.
  
  return {
    metrics: {
      totalChats: totalChats || 0,
      activeUsers: activeUsers || 0,
      aiHandover: aiHandover.toFixed(1),
      uptime: "99.9" // Placeholder for system health
    },
    weeklyVolume: [40, 60, 45, 80, 55, 90, 70, 85, 95, 65, 50, 75] // Placeholder time-series
  };
}

