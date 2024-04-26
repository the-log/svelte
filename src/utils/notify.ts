// import '@shoelace-style/shoelace/dist/components/alert/alert.js';

interface AlertOptions {
  message?: string;
  title?: string;
  variant?: string;
  icon?: string;
  duration?: number;
}

function escapeHtml(html: string) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

export function notify(options: AlertOptions = {}) {
  let {
    message,
    title,
    variant,
    icon,
    duration,
  } = options;

  message ||= '';
  title ||= '';
  variant ||= 'primary';
  icon ||= 'info-circle';
  duration ||= 5000;

  const alert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable: true,
    duration: duration,
    innerHTML: `
      <sl-icon name="${icon}" slot="icon"></sl-icon>
      ${title ? `<strong>${escapeHtml(title)}</strong><br>` : ``}
      ${escapeHtml(message)}
    `
  });

  document.body.append(alert);
  return alert.toast();
}
