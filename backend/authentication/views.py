from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from accounts.models import User, Staff, Student, Department

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username is email (staff) or roll number (student)
        is_email = '@' in username
        
        user = None
        if is_email:
            try:
                staff = Staff.objects.filter(email=username).first()
                if staff:
                    user = staff.user
            except:
                pass
        else:
            try:
                student = Student.objects.filter(roll_number=username).first()
                if student:
                    user = student.user
            except:
                pass
        
        if not user:
            user = authenticate(username=username, password=password)
        
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            
            role = 'staff' if hasattr(user, 'staff_profile') else 'student'
            profile_id = None
            name = None
            
            if role == 'staff':
                profile_id = user.staff_profile.id
                name = user.staff_profile.name
            else:
                profile_id = user.student_profile.id
                name = user.student_profile.name
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': role,
                'profile_id': profile_id,
                'name': name,
                'user_id': user.id
            })
        
        return Response({'error': 'Invalid credentials'}, 
                       status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)

class StaffRegisterView(APIView):
    permission_classes = [AllowAny]
    
    def validate_email(self, email):
        try:
            validate_email(email)
            return True
        except ValidationError:
            return False
    
    def validate_password_strength(self, password):
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        return True, "Password is valid"
    
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        department_name = request.data.get('department')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        
        # Validation
        if not all([name, email, department_name, password]):
            return Response({'error': 'All fields are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({'error': 'Passwords do not match'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        is_valid, message = self.validate_password_strength(password)
        if not is_valid:
            return Response({'error': message}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not self.validate_email(email):
            return Response({'error': 'Invalid email format'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email exists
        if Staff.objects.filter(email=email).exists() or User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if department exists and has no staff
        department, created = Department.objects.get_or_create(name=department_name)
        if hasattr(department, 'staff') and department.staff is not None:
            return Response({'error': 'Department already has a staff member'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role='staff'
        )
        
        # Create staff profile
        staff = Staff.objects.create(
            user=user,
            name=name,
            email=email,
            department=department
        )
        
        return Response({
            'message': 'Staff registered successfully',
            'staff_id': staff.id
        }, status=status.HTTP_201_CREATED)

class StudentRegisterView(APIView):
    permission_classes = [AllowAny]
    
    def validate_password_strength(self, password):
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        return True, "Password is valid"
    
    def post(self, request):
        name = request.data.get('name')
        roll_number = request.data.get('roll_number')
        email = request.data.get('email')
        department_name = request.data.get('department')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        
        # Validation
        if not all([name, roll_number, email, department_name, password]):
            return Response({'error': 'All fields are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({'error': 'Passwords do not match'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        is_valid, message = self.validate_password_strength(password)
        if not is_valid:
            return Response({'error': message}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check uniqueness
        if Student.objects.filter(roll_number=roll_number).exists():
            return Response({'error': 'Roll number already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if Student.objects.filter(email=email).exists() or User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create department
        department, _ = Department.objects.get_or_create(name=department_name)
        
        # Create user
        user = User.objects.create_user(
            username=roll_number,
            email=email,
            password=password,
            role='student'
        )
        
        # Create student profile
        student = Student.objects.create(
            user=user,
            roll_number=roll_number,
            name=name,
            email=email,
            department=department
        )
        
        return Response({
            'message': 'Student registered successfully',
            'student_id': student.id
        }, status=status.HTTP_201_CREATED)