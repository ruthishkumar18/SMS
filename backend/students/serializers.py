from rest_framework import serializers
from accounts.models import Student, Department

class StudentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'name', 'email', 'department', 'department_name', 
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class StudentCreateSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'name', 'email', 'department', 'department_name']
    
    def validate_roll_number(self, value):
        if Student.objects.filter(roll_number=value).exists():
            raise serializers.ValidationError("Roll number already exists")
        return value
    
    def validate_email(self, value):
        if Student.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate(self, data):
        # Ensure department is provided
        if not data.get('department'):
            raise serializers.ValidationError({"department": "Department is required"})
        return data