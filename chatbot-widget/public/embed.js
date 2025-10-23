// Chatbot Widget Embed Script
// This script can be included in any website to embed the chatbot

(function() {
  'use strict';

  // Configuration
  const WIDGET_URL = window.CHATBOT_WIDGET_URL || 'http://localhost:5174';

  // Create iframe for the widget
  function loadChatbotWidget() {
    // Check if widget is already loaded
    if (document.getElementById('chatbot-widget-iframe')) {
      console.warn('Chatbot widget is already loaded');
      return;
    }

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.id = 'chatbot-widget-iframe';
    iframe.src = WIDGET_URL;
    iframe.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      max-width: 420px;
      max-height: 680px;
      border: none;
      z-index: 999999;
      pointer-events: none;
    `;

    // Allow pointer events on the iframe content
    iframe.setAttribute('allow', 'autoplay');
    iframe.setAttribute('frameborder', '0');

    // Append to body
    document.body.appendChild(iframe);

    // Enable pointer events after load
    iframe.onload = function() {
      iframe.style.pointerEvents = 'auto';
    };

    console.log('Chatbot widget loaded successfully');
  }

  // Load widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadChatbotWidget);
  } else {
    loadChatbotWidget();
  }

  // Expose function to manually reload widget
  window.reloadChatbotWidget = function() {
    const existingIframe = document.getElementById('chatbot-widget-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }
    loadChatbotWidget();
  };
})();
