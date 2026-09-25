export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

export const ERROR_MESSAGES = {
  overviewUnavailable: "Overview data is unavailable",
  validationFailed: "请求参数不合法",
  gameNotFound: "桌游不存在或已被删除",
  outOfStock: "手慢了，该桌游最后一份刚被开走",
  sessionNotFound: "开桌记录不存在",
  internal: "服务器开小差了，请稍后再试",
};
