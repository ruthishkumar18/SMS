from django.urls import path
from .views import LoginView, LogoutView, StaffRegisterView, StudentRegisterView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('staff/register/', StaffRegisterView.as_view(), name='staff_register'),
    path('student/register/', StudentRegisterView.as_view(), name='student_register'),
]