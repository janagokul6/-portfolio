/**
 * autofill.js — Content Script
 * 
 * Injected on demand to map and fill ATS form fields using the user's Master Profile.
 */

// Only add the listener if it hasn't been added already (in case of multiple injections)
if (!window.autoApplyAutofillInjected) {
  window.autoApplyAutofillInjected = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DO_AUTOFILL') {
      doAutofill(message.profile)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async
    }
  });
}

/**
 * Trigger React-compatible change events after setting a value programmatically.
 */
function setNativeValue(element, value) {
  if (!element) return;
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter?.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Maps common field names to profile properties
 */
function mapField(nameOrId, labelText, profile) {
  const n = (nameOrId + ' ' + labelText).toLowerCase();
  
  if (n.includes('first name') || n.includes('fname') || n.includes('given name')) return profile.firstName;
  if (n.includes('last name') || n.includes('lname') || n.includes('family name')) return profile.lastName;
  if (n.includes('name') && !n.includes('company')) return `${profile.firstName} ${profile.lastName}`;
  
  if (n.includes('email')) return profile.email;
  if (n.includes('phone')) return profile.phone;
  if (n.includes('location') || n.includes('city')) return profile.location;
  
  if (n.includes('linkedin')) return profile.linkedinUrl;
  if (n.includes('github')) return profile.githubUrl;
  if (n.includes('portfolio') || n.includes('website')) return profile.portfolioUrl;
  
  return null;
}

/**
 * Main autofill logic
 */
async function doAutofill(profile) {
  const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type])'));
  
  // 1. Fill standard text inputs
  for (const input of inputs) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    const labelText = label ? label.textContent : (input.placeholder || '');
    
    const value = mapField(input.name || input.id, labelText, profile);
    if (value && !input.value) {
      setNativeValue(input, value);
    }
  }

  // 2. Look for open-ended custom questions in textareas
  const textareas = Array.from(document.querySelectorAll('textarea'));
  
  for (const textarea of textareas) {
    // If it's already filled, skip it
    if (textarea.value.trim().length > 0) continue;

    const label = document.querySelector(`label[for="${textarea.id}"]`);
    // Find closest container label or preceding text if no explicit label
    const labelText = label ? label.textContent : (textarea.closest('div, label')?.textContent || textarea.placeholder || '');
    const n = (textarea.name + ' ' + textarea.id + ' ' + labelText).toLowerCase();

    // Avoid standard cover letter fields or notes
    if (n.includes('cover letter') || n.includes('notes') || n.includes('additional info')) {
      continue;
    }

    // It's likely a custom question. Let's ask the background script to generate an answer.
    const company = extractCompany();
    const position = extractPosition();
    
    // We only generate if we have a question that looks like a question
    const questionText = labelText.trim().split('\n')[0]; // grab just the first line
    
    if (questionText.length > 10 && questionText.includes('?')) {
      // Send a message to background script to generate the answer
      textarea.placeholder = "✨ Generating answer...";
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ 
            type: 'GENERATE_ANSWER', 
            question: questionText,
            company,
            position
          }, (res) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            resolve(res);
          });
        });
        
        if (response && response.success && response.answer) {
          setNativeValue(textarea, response.answer);
        } else {
          textarea.placeholder = "Could not generate answer.";
        }
      } catch {
        textarea.placeholder = "Error generating answer.";
      }
    }
  }
}

// ─── Helpers to extract context for LLM ───

function extractCompany() {
  const title = document.title.toLowerCase();
  const meta = document.querySelector('meta[property="og:site_name"]');
  if (meta && meta.content) return meta.content;
  if (title.includes('greenhouse')) return title.split(' - ')[0];
  if (title.includes('lever')) return title.split('-')[0];
  return document.domain;
}

function extractPosition() {
  const h1 = document.querySelector('h1, h2');
  if (h1) return h1.textContent.trim();
  return document.title.split('-')[0].trim();
}
