// Custom type declarations for @inlang/paraglide-js

declare module '@inlang/paraglide-js/server' {
  export function paraglideMiddleware(request: Request, callback: (args: { request: Request; locale: string }) => Response | Promise<Response>): Response | Promise<Response>;
}

declare module '@inlang/paraglide-js/runtime' {
  export function deLocalizeUrl(url: string): { pathname: string };
}