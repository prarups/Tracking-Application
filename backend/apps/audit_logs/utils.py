from .models import ActivityLog

def create_audit_log(ticket, actor, action_type, field_name=None, old_value=None, new_value=None, request=None):
    ip = None
    user_agent = None
    if request:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
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
