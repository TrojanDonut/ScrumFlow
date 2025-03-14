from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class User(AbstractUser):
    """Custom user model to support all the user types in the system"""
    
    class Role(models.TextChoices):
        SYSTEM_ADMIN = 'SYSTEM_ADMIN', _('System Administrator')
        PRODUCT_OWNER = 'PRODUCT_OWNER', _('Product Owner')
        SCRUM_MASTER = 'SCRUM_MASTER', _('Scrum Master')
        DEVELOPER = 'DEVELOPER', _('Developer')
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.DEVELOPER,
    )
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_timestamp = models.DateTimeField(null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_system_admin(self):
        return self.role == self.Role.SYSTEM_ADMIN
    
    @property
    def is_product_owner(self):
        return self.role == self.Role.PRODUCT_OWNER
    
    @property
    def is_scrum_master(self):
        return self.role == self.Role.SCRUM_MASTER
    
    @property
    def is_developer(self):
        return self.role == self.Role.DEVELOPER
        
    def record_login(self, ip_address=None):
        """Record successful login information"""
        self.last_login_timestamp = timezone.now()
        self.last_login_ip = ip_address
        self.failed_login_attempts = 0
        self.save(update_fields=['last_login_timestamp', 'last_login_ip', 'failed_login_attempts'])
        
    def record_failed_login(self):
        """Record failed login attempt"""
        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()
        self.save(update_fields=['failed_login_attempts', 'last_failed_login']) 