from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.models import Staff
from .serializers import StaffSerializer

class StaffProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if hasattr(request.user, 'staff_profile'):
            serializer = StaffSerializer(request.user.staff_profile)
            return Response(serializer.data)
        return Response({'error': 'Not a staff member'}, status=403)