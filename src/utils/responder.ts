import { Request, Response } from "express";

interface resultType {
  message?: string;
  error?: any;
  httpCode?: number;
  data?: any;
}

const responder = {
  sendFailureResponse: (response: Response, result: resultType) => {
    return response.status(result.httpCode || 400).send({
      success: false,
      message: result.error,
      code: result.httpCode || "FAILURE",
    });
  },
  sendSuccessResponse: (response: Response, result: resultType) => {
    let jsonResponse: any = {
      success: true,
      message: result.message,
    };

    if (result.data) {
      jsonResponse = { ...jsonResponse, data: result.data };
    }
    return response.status(result.httpCode || 200).send(jsonResponse);
  },
};

export default (response: Response, result: resultType) => {
  if (result.error) {
    return responder.sendFailureResponse(response, result);
  }
  return responder.sendSuccessResponse(response, result);
};
