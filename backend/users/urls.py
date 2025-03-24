from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/me/', views.CurrentUserView.as_view(), name='current-user'),
    path('users/profile/update/', views.UserProfileUpdateView.as_view(), name='profile-update'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/2fa/setup/', views.TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('auth/2fa/verify/', views.TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('auth/2fa/disable/', views.TwoFactorDisableView.as_view(), name='2fa-disable'),
]
