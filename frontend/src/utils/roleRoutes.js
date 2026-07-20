import { ROLES } from "../api/authApi";

export function homeForRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.EXPERT:
      return "/expert";
    case ROLES.EXPERT_APPLICANT:
      return "/pending";
    default:
      return "/setup";
  }
}
