
// Language tab switching with IDE-style tabs
function showTab(language) {
    // Track the tab click
    trackLanguageTab(language);
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });

    // Remove active state from all tab buttons
    const tabButtons = document.querySelectorAll('[id$="-tab"]');
    tabButtons.forEach(button => {
        button.classList.remove('border-primary', 'text-white', 'bg-gray-700/50');
        button.classList.add('border-transparent', 'text-gray-400');
    });

    // Show selected tab content
    const selectedContent = document.getElementById(language + '-content');
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }

    // Set active state for selected tab
    const selectedTab = document.getElementById(language + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('border-primary', 'text-white', 'bg-gray-700/50');
        selectedTab.classList.remove('border-transparent', 'text-gray-400');
    }
}

// A/B Testing functionality
function initializeABTest() {
    // Check for query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const versionParam = urlParams.get('v');
    
    let version;
    
    if (versionParam === '1' || versionParam === '2') {
        version = versionParam;
        // Store the version for future visits
        localStorage.setItem('abTestVersion', version);
    } else {
        // Check localStorage for existing version
        version = localStorage.getItem('abTestVersion');
        
        // If no stored version, randomly assign
        if (!version) {
            version = Math.random() < 0.5 ? '1' : '2';
            localStorage.setItem('abTestVersion', version);
        }
    }
    
    // Apply the version class to body
    document.body.classList.add(`version-${version}`);
    
    // Update the hidden form field with the version
    const versionField = document.getElementById('abTestVersionField');
    if (versionField) {
        versionField.value = version;
    }
    
    // Track the version assignment
    if (typeof gtag !== 'undefined') {
        gtag('event', 'ab_test_version_assigned', {
            'event_category': 'ab_test',
            'event_label': `version_${version}`,
            'ab_test_version': version
        });
    }
    
    return version;
}

// Initialize default tab on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize A/B test first
    initializeABTest();
    
    // Update navigation immediately after A/B test (no delay)
    const isVersion2 = document.body.classList.contains('version-2');
    
    // Update features navigation
    const featuresLinks = document.querySelectorAll('a[href="/#features"], a[href="#features"]');
    featuresLinks.forEach(link => {
        if (isVersion2) {
            link.style.display = 'none';
        } else {
            link.style.display = '';
        }
    });

    // Initialize all DOM-dependent functionality with a single delay
    setTimeout(() => {
        // Initialize tabs if present
        if (document.getElementById('kotlin-tab')) {
            showTab('kotlin');
        }
        
        // Initialize signup form handler
        const signupForm = document.querySelector('#signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', handleFormSubmission);
            
            // Populate the version field
            const versionField = signupForm.querySelector('[name="abTestVersion"]');
            if (versionField && !versionField.value) {
                const currentVersion = localStorage.getItem('abTestVersion') || '1';
                versionField.value = currentVersion;
            }
            
            // Track form field interactions
            initializeFormTracking(signupForm);
        }
    }, 200);
    
    // Initialize tracking (no delay needed)
    
    // Track internal navigation clicks
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(link => {
        link.addEventListener('click', function() {
            trackInternalNavigation(this.href, this.textContent.trim());
        });
    });
    
    // Track external link clicks
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.addEventListener('click', function() {
            trackExternalLink(this.href, this.textContent.trim());
        });
    });

    window.addEventListener('scroll', trackScrollDepth);
    
    // Initialize time tracking
    initializeTimeTracking();
    
    // Initialize copy button tracking (for future use)
    initializeCopyButtonTracking();
    
    // Initialize A/B test funnel tracking
    initializeABTestFunnelTracking();
});

// Utility function for iframe form submission
function submitViaIframe(formData, actionUrl) {
    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'hidden-form-iframe';
    document.body.appendChild(iframe);

    // Create a temporary form that posts to the iframe
    const tempForm = document.createElement('form');
    tempForm.action = actionUrl;
    tempForm.method = 'POST';
    tempForm.target = 'hidden-form-iframe';

    // Add form data as hidden inputs
    Object.keys(formData).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = formData[key];
        tempForm.appendChild(input);
    });

    document.body.appendChild(tempForm);
    tempForm.submit();

    // Clean up after delay
    setTimeout(() => {
        document.body.removeChild(tempForm);
        document.body.removeChild(iframe);
    }, 1500);
}

// Form submission handling
function handleFormSubmission(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    const formMessage = form.parentNode.querySelector('#formMessage');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing Up...';
    submitBtn.disabled = true;
    
    // Mark form as submitted for abandonment tracking
    form.dataset.submitted = 'true';

    // Collect form data
    const formData = {
        email: form.querySelector('[name="email"]').value,
        language: form.querySelector('[name="language"]').value,
        abTestVersion: form.querySelector('[name="abTestVersion"]').value
    };

    // Submit via iframe
    submitViaIframe(formData,
        'https://script.google.com/macros/s/AKfycbyj-DgGv1rH6_D9EeysHOa3JmSH4Ih710HCVX44C7hpGJCG6ySdttccLUfzMWx3VFNMcA/exec');
    
    // Track form submission
    if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
            'event_category': 'signup',
            'event_label': 'early_access_signup',
            'ab_test_version': formData.abTestVersion,
            'language_preference': formData.language,
            'use_case': formData.role
        });
    }

    // Show success message after delay
    setTimeout(() => {
        formMessage.className = 'mt-4 p-4 rounded-lg bg-green-900/20 border border-green-800/50 text-green-300';
        formMessage.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>Welcome aboard! You're now on the early access list.</span>
            </div>
        `;
        formMessage.classList.remove('hidden');

        // Reset form and restore button
        form.reset();
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }, 1500);
}



// Track language tab clicks
function trackLanguageTab(language) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'tab_click', {
            'event_category': 'engagement',
            'event_label': 'language_tab',
            'language': language
        });
    }
}

// Track external links
function trackExternalLink(url, linkText) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
            'event_category': 'external_link',
            'event_label': linkText,
            'external_url': url
        });
    }
}

// Track scroll depth
let scrollDepthTracked = [];
function trackScrollDepth() {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);

    [25, 50, 75, 100].forEach(milestone => {
        if (scrollPercent >= milestone && !scrollDepthTracked.includes(milestone)) {
            scrollDepthTracked.push(milestone);
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll', {
                    'event_category': 'engagement',
                    'event_label': `${milestone}%`,
                    'page_location': window.location.pathname
                });
            }
        }
    });
}

// Track internal navigation clicks
function trackInternalNavigation(href, linkText) {
    if (typeof gtag !== 'undefined') {
        const section = href.split('#')[1] || 'unknown';
        gtag('event', 'navigation_click', {
            'event_category': 'navigation',
            'event_label': section,
            'link_text': linkText,
            'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
        });
    }
}

// FAQ Toggle with tracking
function toggleFAQ(index) {
    const content = document.getElementById(`content-${index}`);
    const icon = document.getElementById(`icon-${index}`);
    const isOpening = content.classList.contains('hidden');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
    
    // Track FAQ interaction
    if (typeof gtag !== 'undefined' && isOpening) {
        const faqTitle = icon.closest('.faq-toggle').querySelector('h3').textContent.trim();
        gtag('event', 'faq_click', {
            'event_category': 'engagement',
            'event_label': faqTitle,
            'faq_index': index,
            'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
        });
    }
}

// Form field tracking
let formInteractionStarted = false;
let formFieldsInteracted = new Set();

function initializeFormTracking(form) {
    const fields = form.querySelectorAll('input[type="text"], input[type="email"], select');
    
    fields.forEach(field => {
        // Track when user starts interacting with form
        field.addEventListener('focus', function() {
            if (!formInteractionStarted && typeof gtag !== 'undefined') {
                formInteractionStarted = true;
                gtag('event', 'form_start', {
                    'event_category': 'form',
                    'event_label': 'signup_form_started',
                    'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
                });
            }
            
            // Track individual field interactions
            const fieldName = this.name;
            if (!formFieldsInteracted.has(fieldName) && typeof gtag !== 'undefined') {
                formFieldsInteracted.add(fieldName);
                gtag('event', 'form_field_interaction', {
                    'event_category': 'form',
                    'event_label': fieldName,
                    'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
                });
            }
        });
        
        // Track field abandonment
        field.addEventListener('blur', function() {
            if (this.value === '' && formFieldsInteracted.has(this.name) && typeof gtag !== 'undefined') {
                gtag('event', 'form_field_abandoned', {
                    'event_category': 'form',
                    'event_label': this.name,
                    'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
                });
            }
        });
    });
    
    // Track form abandonment on page unload
    window.addEventListener('beforeunload', function() {
        if (formInteractionStarted && !form.dataset.submitted && typeof gtag !== 'undefined') {
            const filledFields = Array.from(fields).filter(f => f.value !== '').length;
            gtag('event', 'form_abandoned', {
                'event_category': 'form',
                'event_label': 'signup_form_abandoned',
                'fields_filled': filledFields,
                'total_fields': fields.length,
                'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
            });
        }
    });
}

// Time on page tracking
let pageStartTime = Date.now();
let timeTrackingEvents = [30, 60, 120, 300]; // Track at 30s, 1min, 2min, 5min

function initializeTimeTracking() {
    timeTrackingEvents.forEach(seconds => {
        setTimeout(() => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'time_on_page', {
                    'event_category': 'engagement',
                    'event_label': `${seconds}_seconds`,
                    'time_seconds': seconds,
                    'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
                });
            }
        }, seconds * 1000);
    });
    
    // Track total time on page unload
    window.addEventListener('beforeunload', function() {
        const timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
        if (typeof gtag !== 'undefined' && timeSpent > 5) { // Only track if spent more than 5 seconds
            gtag('event', 'page_exit', {
                'event_category': 'engagement',
                'event_label': 'page_exit_time',
                'time_spent_seconds': timeSpent,
                'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
            });
        }
    });
}

// Copy button tracking (for future use)
function initializeCopyButtonTracking() {
    // Track any copy buttons that might be added later
    document.addEventListener('click', function(e) {
        if (e.target.matches('.copy-btn, [data-copy], .fa-copy')) {
            if (typeof gtag !== 'undefined') {
                const codeContent = e.target.dataset.copy || 'unknown';
                gtag('event', 'copy_code', {
                    'event_category': 'engagement',
                    'event_label': 'code_snippet_copied',
                    'content_length': codeContent.length,
                    'ab_test_version': localStorage.getItem('abTestVersion') || 'unknown'
                });
            }
        }
    });
}

// A/B Test conversion funnel tracking
function initializeABTestFunnelTracking() {
    // Track section visibility/engagement based on A/B test version
    const abTestVersion = localStorage.getItem('abTestVersion') || 'unknown';
    
    // Use Intersection Observer to track when sections come into view
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const sectionName = entry.target.id || entry.target.className.split(' ')[0];
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'section_viewed', {
                            'event_category': 'funnel',
                            'event_label': sectionName,
                            'ab_test_version': abTestVersion,
                            'section_order': Array.from(document.querySelectorAll('section')).indexOf(entry.target) + 1
                        });
                    }
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }
    
    // Track progression through key conversion points
    setTimeout(() => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'funnel_entry', {
                'event_category': 'funnel',
                'event_label': 'page_loaded',
                'ab_test_version': abTestVersion
            });
        }
    }, 1000);
}
