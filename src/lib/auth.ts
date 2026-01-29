/**
 * 用户认证和权限管理
 *
 * 注意：这是一个示例实现，生产环境建议使用成熟的认证服务：
 * - Auth0
 * - AWS Cognito
 * - Firebase Authentication
 * - NextAuth.js
 */

/**
 * 用户信息类型
 */
export interface UserInfo {
  userId: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
}

/**
 * 从请求头中提取用户信息
 *
 * 生产环境应该：
 * 1. 验证JWT token的有效性
 * 2. 检查token是否过期
 * 3. 从数据库中获取完整的用户信息
 */
export function getUserFromRequest(req: NextRequest): UserInfo | null {
  try {
    // 从Authorization header中获取token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // TODO: 在生产环境中，这里应该验证JWT token
    // const decoded = await verifyJWT(token);

    // 示例：从token中解析用户信息（仅用于演示）
    // 实际实现应该使用成熟的JWT库
    const userInfo: UserInfo = {
      userId: 'user_123', // 从token中获取
      name: '张老师', // 从token中获取
      email: 'teacher@example.com', // 从token中获取
      role: 'teacher', // 从token中获取
    };

    return userInfo;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 检查用户权限
 */
export function checkPermission(
  user: UserInfo | null,
  requiredRole: 'teacher' | 'admin' = 'teacher'
): boolean {
  if (!user) {
    return false;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return false;
  }

  return true;
}

/**
 * 返回未授权错误
 */
export function unauthorizedResponse(message: string = '未授权，请先登录') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * 使用示例：
 *
 * export async function POST(req: NextRequest) {
 *   // 验证用户权限
 *   const user = getUserFromRequest(req);
 *   if (!user || !checkPermission(user, 'teacher')) {
 *     return unauthorizedResponse();
 *   }
 *
 *   // 获取用户ID，用于个性化处理
 *   const userId = user.userId;
 *
 *   // ... 处理请求逻辑
 * }
 */

/**
 * 请求频率限制
 */
const userRequestCount = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 3,
  timeWindow: number = 60000 // 1分钟
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const user = userRequestCount.get(userId);

  if (!user || now > user.resetTime) {
    // 创建新的计数器或重置过期的计数器
    userRequestCount.set(userId, {
      count: 1,
      resetTime: now + timeWindow,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + timeWindow,
    };
  }

  if (user.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: user.resetTime,
    };
  }

  user.count++;
  return {
    allowed: true,
    remaining: maxRequests - user.count,
    resetTime: user.resetTime,
  };
}

/**
 * 使用示例：
 *
 * export async function POST(req: NextRequest) {
 *   const user = getUserFromRequest(req);
 *   if (!user) {
 *     return unauthorizedResponse();
 *   }
 *
 *   // 检查请求频率限制
 *   const rateLimit = checkRateLimit(user.userId, 3, 60000);
 *   if (!rateLimit.allowed) {
 *     return NextResponse.json(
 *       {
 *         error: '请求过于频繁，请稍后再试',
 *         remaining: rateLimit.remaining,
 *         resetTime: rateLimit.resetTime,
 *       },
 *       {
 *         status: 429, // Too Many Requests
 *         headers: {
 *           'X-RateLimit-Remaining': rateLimit.remaining.toString(),
 *           'X-RateLimit-Reset': rateLimit.resetTime.toString(),
 *           'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
 *         },
 *       }
 *     );
 *   }
 *
 *   // ... 处理请求逻辑
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
