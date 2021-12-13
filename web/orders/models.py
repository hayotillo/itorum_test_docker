from django.db import models


class Client(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

    class Meta:
        pass


class Order(models.Model):
    price = models.FloatField(max_length=7, null=True, blank=True)
    created_at = models.DateField(auto_now_add=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=False, related_name='orders')

    def __str__(self):
        return f'{self.price} {self.client.name}'

    class Meta:
        pass
