import cloudinary
import cloudinary.uploader
import os
from datetime import datetime

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)


class ImageService:
    @staticmethod
    def upload_prayer_photo(image_data, user_id, prayer_name):
        try:
            timestamp = datetime.utcnow().strftime('%Y-%m-%d_%H%M%S')
            public_id = f"mizaan/prayers/{user_id}/{prayer_name}_{timestamp}"

            result = cloudinary.uploader.upload(
                image_data,
                public_id=public_id,
                folder="mizaan/prayers",
                transformation=[
                    {'width': 800, 'height': 800, 'crop': 'limit'},
                    {'quality': 'auto'}
                ]
            )

            return result['secure_url']

        except Exception as e:
            print(f"Error uploading image: {e}")
            return None

    @staticmethod
    def delete_image(image_url):
        try:
            # Extract public_id from URL
            parts = image_url.split('/')
            # Find index of 'mizaan' and reconstruct public_id
            mizaan_index = parts.index('mizaan')
            public_id = '/'.join(parts[mizaan_index:]).split('.')[0]
            cloudinary.uploader.destroy(public_id)
            return True
        except Exception as e:
            print(f"Error deleting image: {e}")
            return False
