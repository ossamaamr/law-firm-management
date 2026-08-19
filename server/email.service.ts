import { logger } from "./logger";

function unavailable(operation: string): false {
  logger.error(`Email delivery is unavailable: ${operation}`);
  return false;
}

export async function sendRegistrationRequestEmail(
  _registrationData: {
    fullName: string;
    email: string;
    phone: string;
    birthDate: string;
    firmName: string;
    city: string;
    country: string;
  },
  _adminEmail: string,
): Promise<boolean> {
  return unavailable("registration request provider is not configured");
}

export async function sendApprovalEmail(
  _userEmail: string,
  _userName: string,
  _firmName: string,
  _identifier: string,
): Promise<boolean> {
  return unavailable("approval provider is not configured");
}

export async function sendRejectionEmail(
  _userEmail: string,
  _userName: string,
  _rejectionReason: string,
): Promise<boolean> {
  return unavailable("rejection provider is not configured");
}

export async function sendActivityNotificationEmail(
  _firmEmail: string,
  _activityData: {
    userName: string;
    actionType: string;
    entityType: string;
    entityName: string;
    timestamp: Date;
  },
): Promise<boolean> {
  return unavailable("activity notification provider is not configured");
}
