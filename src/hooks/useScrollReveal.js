import { useEffect } from 'react';

export const useScrollReveal = () => {
      useEffect(() => {
            const observerCallback = (entries, observer) => {
                  entries.forEach(entry => {
                        if (entry.isIntersecting) {
                              entry.target.classList.add('revealed');
                              observer.unobserve(entry.target);
                        }
                  });
            };

            const observerOptions = {
                  root: null,
                  rootMargin: '0px',
                  threshold: 0.15
            };

            const observer = new IntersectionObserver(observerCallback, observerOptions);

            // Find all elements with the class and observe them
            const revealElements = document.querySelectorAll('.reveal-on-scroll');
            revealElements.forEach(el => observer.observe(el));

            return () => {
                  revealElements.forEach(el => observer.unobserve(el));
                  observer.disconnect();
            };
      }, []);
};