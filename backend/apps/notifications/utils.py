from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from apps.users.models import User, RoleChoices
from apps.groups_app.models import GroupMember

def notify_ticket_event(ticket, actor, verb, message, target_user=None):
    recipients = set()

    if target_user:
        recipients.add(target_user)
    else:
        # Group members
        if ticket.assigned_group:
            group_user_ids = GroupMember.objects.filter(group=ticket.assigned_group).values_list('user_id', flat=True)
            for uid in group_user_ids:
                recipients.add(uid)
            if ticket.assigned_group.lead:
                recipients.add(ticket.assigned_group.lead.id)

        # Assigned user
        if ticket.assigned_user:
            recipients.add(ticket.assigned_user.id)

        # Admins & Managers
        admin_ids = User.objects.filter(role__in=[RoleChoices.SUPER_ADMIN, RoleChoices.ADMIN, RoleChoices.MANAGER]).values_list('id', flat=True)
        for aid in admin_ids:
            recipients.add(aid)

    # Exclude actor from receiving their own notification
    recipients.discard(actor.id if isinstance(actor, User) else actor)

    channel_layer = get_channel_layer()

    for user_id in recipients:
        if isinstance(user_id, User):
            recipient_obj = user_id
            user_id = user_id.id
        else:
            recipient_obj = User.objects.get(id=user_id)

        notification = Notification.objects.create(
            recipient=recipient_obj,
            actor=actor if isinstance(actor, User) else User.objects.get(id=actor),
            ticket=ticket,
            verb=verb,
            message=message
        )

        data = {
            'id': notification.id,
            'verb': verb,
            'message': message,
            'ticket_id': ticket.id if ticket else None,
            'ticket_number': ticket.ticket_number if ticket else '',
            'created_at': str(notification.created_at),
            'actor_username': actor.username if isinstance(actor, User) else ''
        }

        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}_notifications",
                {
                    'type': 'send_notification',
                    'data': data
                }
            )
