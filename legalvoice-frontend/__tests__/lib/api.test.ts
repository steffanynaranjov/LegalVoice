// legalvoice-frontend/__tests__/lib/api.test.ts
jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
      }),
    },
  }),
}))

import api from '@/lib/api'

describe('api interceptor', () => {
  it('api client existe y es configurable', () => {
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
  })
})
