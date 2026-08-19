import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tracking_core.settings')

app = Celery('tracking_core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
