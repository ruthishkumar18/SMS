from rest_framework import serializers
from accounts.models import Staff

class StaffSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'name', 'email', 'department', 'department_name', 'created_at', 'updated_at']