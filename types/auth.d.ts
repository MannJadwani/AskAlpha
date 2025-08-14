interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  plan: string;
  frequency: string;
  date: string; // ISO date string format
  userId: string;
  user: User;
  monthenddate?: string;
  subscriptionid?: string;
}

declare namespace JSX {
  interface IntrinsicElements {
    'spline-viewer': any;
  }
}