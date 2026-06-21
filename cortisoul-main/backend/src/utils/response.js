const normalizeMessage = (message) => {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (message instanceof Error) return message.message;

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
};

const response = (res, statusCode, message, data) => {
  return res
    .status(statusCode)
    .json({
      code: statusCode,
      status: statusCode < 400 ? 'success' : 'failed',
      message: normalizeMessage(message),
      data,
    })
    .end();
};

export default response;
