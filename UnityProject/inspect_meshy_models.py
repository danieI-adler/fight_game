import bpy
import os

def analyze_fbx(fbx_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    print(f"\n================ ANALISANDO: {os.path.basename(fbx_path)} ================")
    print(f"Total de objetos importados: {len(bpy.data.objects)}")
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            verts = len(obj.data.vertices)
            faces = len(obj.data.polygons)
            print(f"Mesh: {obj.name} | Vértices: {verts} | Faces: {faces} | Materiais: {[m.name for m in obj.data.materials]}")
        elif obj.type == 'ARMATURE':
            bones = len(obj.data.bones)
            print(f"Esqueleto (Armature): {obj.name} | Total de Ossos: {bones}")

if __name__ == "__main__":
    f1 = r"C:\Users\fogoy\Downloads\Meshy_AI_Gilded_Duelist_0905180425_generate.fbx"
    f2 = r"C:\Users\fogoy\Downloads\Meshy_AI_Gilded_Shadow_Vanguar_0905180614_generate.fbx"
    if os.path.exists(f1): analyze_fbx(f1)
    if os.path.exists(f2): analyze_fbx(f2)
