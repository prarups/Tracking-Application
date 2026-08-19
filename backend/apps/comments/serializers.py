import re
from rest_framework import serializers
from .models import Comment
from apps.users.serializers import UserSerializer
from apps.users.models import User

class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    replies_count = serializers.IntegerField(source='replies.count', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'ticket', 'attachment', 'author', 'author_details', 'parent', 'content', 'is_pinned', 'edit_history', 'mentions', 'replies_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
