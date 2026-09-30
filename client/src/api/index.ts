import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export async function fetchIndustries(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  hasRoles?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.category) query.set('category', params.category);
  if (params?.hasRoles) query.set('hasRoles', 'true');
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/industries?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchIndustryDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/industries/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchRoles(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industryId?: string;
  functionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.industryId) query.set('industryId', params.industryId);
  if (params?.functionId) query.set('functionId', params.functionId);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/roles?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchRoleDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/roles/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchScenarios(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  roleId?: string;
  industryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.roleId) query.set('roleId', params.roleId);
  if (params?.industryId) query.set('industryId', params.industryId);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/scenarios?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchScenarioDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/scenarios/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchSteps(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  scenarioId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.scenarioId) query.set('scenarioId', params.scenarioId);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/steps?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchStepDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/steps/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchSkills(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/skills?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchSkillDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/skills/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchMaterials(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/materials?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchMaterialDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/materials/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchCases(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industryId?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.industryId) query.set('industryId', params.industryId);
  if (params?.roleId) query.set('roleId', params.roleId);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/cases?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchCaseDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/cases/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchCustomers(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  industryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.industryId) query.set('industryId', params.industryId);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const response = await axiosForBackend({
    url: `/api/customers?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchCustomerDetail(id: string) {
  const response = await axiosForBackend({
    url: `/api/customers/${id}`,
    method: 'GET',
  });
  return response.data;
}

export async function globalSearch(q: string, limit = 10) {
  const query = new URLSearchParams();
  query.set('q', q);
  query.set('limit', String(limit));

  const response = await axiosForBackend({
    url: `/api/search?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchGlobalInsights() {
  const response = await axiosForBackend({
    url: '/api/insights/global',
    method: 'GET',
  });
  return response.data;
}

export async function fetchGovernanceData() {
  const response = await axiosForBackend({
    url: '/api/insights/governance',
    method: 'GET',
  });
  return response.data;
}

export async function fetchOrphanScenarios(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.keyword) query.set('keyword', params.keyword);

  const response = await axiosForBackend({
    url: `/api/insights/orphan-scenarios?${query.toString()}`,
    method: 'GET',
  });
  return response.data;
}

export async function fetchSyncStatus() {
  const response = await axiosForBackend({
    url: '/api/sync/status',
    method: 'GET',
  });
  return response.data;
}

export async function testSyncConnection() {
  const response = await axiosForBackend({
    url: '/api/sync/test-connection',
    method: 'POST',
  });
  return response.data;
}

export async function triggerFullSync() {
  const response = await axiosForBackend({
    url: '/api/sync/full-sync',
    method: 'POST',
  });
  return response.data;
}

export async function reloadSyncCredentials() {
  const response = await axiosForBackend({
    url: '/api/sync/reload-credentials',
    method: 'POST',
  });
  return response.data;
}
