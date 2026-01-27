import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
        return new NextResponse('console.error("Snowky: Project ID required for widget script");', {
            headers: { 'Content-Type': 'application/javascript' }
        });
    }

    // Determine host URL (where Snowky is running)
    // In Vercel, use process.env.NEXT_PUBLIC_APP_URL or host header
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const iframeUrl = `${host}/widget/${projectId}`;

    const script = `
(function() {
  if (document.getElementById('snowky-widget-container')) return;

  const container = document.createElement('div');
  container.id = 'snowky-widget-container';
  container.style.position = 'fixed';
  container.style.zIndex = '9999';
  container.style.bottom = '0';
  container.style.right = '0';
  // Initially small to avoid blocking clicks, the Iframe handles its own expansion visually inside our Page logic?
  // Actually, standard practice: render iframe that handles its own open state visual? 
  // OR, we make the iframe full size of the widget (button size initially).
  // Our ChatInterface component has "isOpen" state.
  // Problem: An iframe needs to resize dynamically to not block the underlying page.
  // Solution: Communicating between iframe and parent window via postMessage is robust but complex.
  // MVP Solution: 
  // We render a fixed size iframe at bottom right. The ChatInterface logic inside handles the button vs chat window.
  // BUT the iframe background must be transparent so the button floats.
  
  container.style.width = '380px'; 
  container.style.height = '620px'; // Max height needed
  container.style.pointerEvents = 'none'; // Click-through by default
  
  const iframe = document.createElement('iframe');
  iframe.src = '${iframeUrl}';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.allow = 'camera; microphone; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
  
  // Enable pointer events on the iframe contents
  iframe.style.pointerEvents = 'auto';

  // Make iframe transparent
  iframe.style.background = 'transparent';
  iframe.setAttribute('allowtransparency', 'true');

  container.appendChild(iframe);
  document.body.appendChild(container);
})();
  `;

    return new NextResponse(script, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
