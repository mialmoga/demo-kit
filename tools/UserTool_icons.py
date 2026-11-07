from PIL import Image
import os

def redimensionar_logo(imagen_path):
    # Verificar si el archivo existe
    if not os.path.exists(imagen_path):
        print(f"Error: No se encontró el archivo '{imagen_path}'.")
        return

    try:
        # Abrir la imagen original
        with Image.open(imagen_path) as img:
            # Definir los tamaños requeridos
            formatos = {
                "android-chrome-192x192.png": (192, 192),
                "android-chrome-512x512.png": (512, 512)
            }

            for nombre_salida, tamano in formatos.items():
                # Redimensionar usando un filtro de alta calidad (Resampling.LANCZOS)
                img_redimensionada = img.resize(tamano, Image.Resampling.LANCZOS)
                
                # Guardar la copia
                img_redimensionada.save(nombre_salida)
                print(f"Copia guardada exitosamente: {nombre_salida}")

    except Exception as e:
        print(f"Ocurrió un error al procesar la imagen: {e}")

if __name__ == "__main__":
    # Nombre del archivo original
    logo_original = "logo.png"
    redimensionar_logo(logo_original)