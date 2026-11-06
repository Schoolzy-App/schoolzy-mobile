import type {
  CreateGateRequestInput,
  CreateGateRequestResponseDto,
  GateCreateOptionsDto,
  GateEligibilityDto,
  GateRequestDetailDto,
  GateRequestListDto,
  GateStudentDto,
} from "@/types/api";

import { request } from "./client";
import { ROUTES } from "./config";

export const GATE_REQUESTS_PAGE_SIZE = 100;

export const gateRequestsApi = {
  /** GET /api/mobile/gate-requests/eligibility */
  eligibility(): Promise<GateEligibilityDto> {
    return request<GateEligibilityDto>({
      method: "GET",
      url: ROUTES.gateRequests.eligibility,
    });
  },

  /** GET /api/mobile/gate-requests/students */
  students(): Promise<GateStudentDto[]> {
    return request<GateStudentDto[]>({
      method: "GET",
      url: ROUTES.gateRequests.students,
    });
  },

  /** GET /api/mobile/gate-requests/create-options?studentSeasonId= */
  createOptions(studentSeasonId: number): Promise<GateCreateOptionsDto> {
    return request<GateCreateOptionsDto>({
      method: "GET",
      url: ROUTES.gateRequests.createOptions,
      params: { studentSeasonId },
    });
  },

  /** GET /api/mobile/gate-requests — parent-created, last 30 school days. */
  list(
    pageNumber = 1,
    pageSize = GATE_REQUESTS_PAGE_SIZE,
  ): Promise<GateRequestListDto> {
    return request<GateRequestListDto>({
      method: "GET",
      url: ROUTES.gateRequests.list,
      params: { pageNumber, pageSize },
    });
  },

  /** GET /api/mobile/gate-requests/{id} */
  detail(id: number): Promise<GateRequestDetailDto> {
    return request<GateRequestDetailDto>({
      method: "GET",
      url: ROUTES.gateRequests.detail(id),
    });
  },

  /** POST /api/mobile/gate-requests — `Idempotency-Key` is required. */
  create(
    input: CreateGateRequestInput,
    idempotencyKey: string,
  ): Promise<CreateGateRequestResponseDto> {
    return request<CreateGateRequestResponseDto>({
      method: "POST",
      url: ROUTES.gateRequests.create,
      data: input,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },

  /** POST /api/mobile/gate-requests/{id}/cancel — `Idempotency-Key` is required. */
  cancel(id: number, idempotencyKey: string): Promise<GateRequestDetailDto> {
    return request<GateRequestDetailDto>({
      method: "POST",
      url: ROUTES.gateRequests.cancel(id),
      headers: { "Idempotency-Key": idempotencyKey },
    });
  },
};
