from .models import ActivityLog

def get_client_ip(request):
    """
    Extracts real client IP address considering reverse proxies (Cloudflare, Nginx, Render, AWS ALB).
    Checks headers in order:
    1. HTTP_X_FORWARDED_FOR (first client IP in chain)
    2. HTTP_CF_CONNECTING_IP (Cloudflare CDN)
    3. HTTP_X_REAL_IP (Nginx / Render proxy)
    4. REMOTE_ADDR (Direct TCP fallback)
    """
    if not request or not hasattr(request, 'META'):
        return '127.0.0.1'

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
        if ip:
            return ip

    cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP')
    if cf_connecting_ip:
        return cf_connecting_ip.strip()

    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()

    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def create_audit_log(ticket, actor, action_type, field_name=None, old_value=None, new_value=None, request=None):
    ip = None
    user_agent = None
    if request:
        ip = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

    ActivityLog.objects.create(
        ticket=ticket,
        actor=actor,
        action_type=action_type,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        ip_address=ip,
        user_agent=user_agent
    )
