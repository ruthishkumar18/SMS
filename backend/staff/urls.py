from django.urls import path
from .views import StaffProfileView

urlpatterns = [
    path('profile/', StaffProfileView.as_view(), name='staff_profile'),
]