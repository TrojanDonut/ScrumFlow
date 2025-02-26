import time
from django.db import connections
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    """Django command to pause execution until database is available"""

    def handle(self, *args, **options):
        self.stdout.write('Waiting for database...')
        db_conn = None
        timeout = settings.WAIT_FOR_DB_TIMEOUT
        start_time = time.time()
        
        while not db_conn:
            elapsed_time = time.time() - start_time
            if elapsed_time > timeout:
                self.stdout.write(self.style.ERROR(
                    f'Database connection timed out after {timeout} seconds'
                ))
                break
                
            try:
                db_conn = connections['default']
                self.stdout.write(self.style.SUCCESS('Database available!'))
            except OperationalError:
                self.stdout.write('Database unavailable, waiting 1 second...')
                time.sleep(1) 