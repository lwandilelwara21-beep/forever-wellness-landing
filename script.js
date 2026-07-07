if (window.AOS) {
  AOS.init({
    once: true,
    duration: 700,
    easing: 'ease-out-cubic'
  });
}

const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const form = document.querySelector('.contact-form');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() || 'there';
    const email = data.get('email')?.toString().trim() || '';
    const message = data.get('message')?.toString().trim() || 'I would like to know more about your products.';
    const whatsappNumber = form.dataset.whatsapp || '27655183942';
    const lowerMessage = message.toLowerCase();

    let response = `Hello Zimkhitha, my name is ${name}. I am interested in your Forever Living wellness products and would love your guidance.`;

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      response += ' I would like to know more about product pricing and available options.';
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('delivery')) {
      response += ' I would like to know how to order, delivery options, and payment methods.';
    } else if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('routine')) {
      response += ' I would love help choosing a simple wellness routine that fits my lifestyle.';
    } else if (lowerMessage.includes('benefit') || lowerMessage.includes('help') || lowerMessage.includes('recommend')) {
      response += ' Please recommend the best product for my wellness goals and explain the benefits.';
    } else {
      response += ' Please guide me with the best options for me.';
    }

    if (email) {
      response += ` My email is ${email}.`;
    }

    response += ` My message: ${message}`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(response)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    form.reset();
  });
}
