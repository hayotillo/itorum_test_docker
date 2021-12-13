from rest_framework import serializers
from .models import *


class OrderSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    def get_client_name(self, r):
        return r.client.name

    class Meta:
        model = Order
        fields = ('id', 'price', 'client_name', 'created_at', 'client')
        extra_kwargs = {
            'client': {'write_only': True}
        }


# class PublicOrderSerializer(serializers.ModelSerializer):
#     client_name = serializers.SerializerMethodField()
#
#     def get_client_names(self, r):
#         return r.client.name
#
#     class Meta:
#         model = Order
#         fields = ('date', 'client_names', 'sum_price')


class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = ('id', 'name')
