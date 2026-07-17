import { z } from "zod";
import { ApiError } from "./apiError.js";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ApiError(400, "Validation failed", result.error.flatten()));
      return;
    }
    req[source] = result.data;
    next();
  };
}
