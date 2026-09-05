import bpy
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_material(name, color, metallic=0.0, roughness=0.5, emission_color=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if emission_color:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission_color
                bsdf.inputs["Emission Strength"].default_value = 2.0
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission_color
    return mat

def create_gustave():
    clear_scene()
    
    # Materiais de Gustave
    mat_skin = create_material("Mat_Skin", (0.92, 0.78, 0.68, 1.0), 0.0, 0.6)
    mat_coat = create_material("Mat_Coat", (0.05, 0.12, 0.22, 1.0), 0.15, 0.7) # Veludo Azul
    mat_gold = create_material("Mat_Gold", (0.95, 0.75, 0.22, 1.0), 0.95, 0.2) # Ouro Metálico
    mat_cyan_glow = create_material("Mat_CyanGlow", (0.2, 0.85, 1.0, 1.0), 0.0, 0.1, (0.2, 0.85, 1.0, 1.0))
    mat_pants = create_material("Mat_Pants", (0.04, 0.06, 0.1, 1.0), 0.1, 0.8)
    mat_boots = create_material("Mat_Boots", (0.1, 0.08, 0.06, 1.0), 0.3, 0.4)
    mat_hair = create_material("Mat_Hair", (0.12, 0.08, 0.05, 1.0), 0.0, 0.85)

    # 1. Tronco & Colete
    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.75, location=(0, 0, 1.15))
    torso = bpy.context.active_object
    torso.name = "Gustave_Torso"
    torso.data.materials.append(mat_coat)

    # 2. Cabeça
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, 0, 1.7))
    head = bpy.context.active_object
    head.name = "Gustave_Head"
    head.scale = (0.9, 1.05, 1.0)
    head.data.materials.append(mat_skin)

    # Cabelos cacheados
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, location=(0, -0.02, 1.78))
    hair = bpy.context.active_object
    hair.name = "Gustave_Hair"
    hair.scale = (0.95, 1.0, 0.75)
    hair.data.materials.append(mat_hair)

    # Bigode
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.18, location=(0, 0.2, 1.63))
    mustache = bpy.context.active_object
    mustache.name = "Gustave_Mustache"
    mustache.rotation_euler = (0, math.radians(90), 0)
    mustache.data.materials.append(mat_hair)

    # 3. Braço Esquerdo Normal (Casaco)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.65, location=(-0.42, 0, 1.15))
    l_arm = bpy.context.active_object
    l_arm.name = "Gustave_LeftArm"
    l_arm.data.materials.append(mat_coat)

    # 4. Braço Direito Mecânico (Overcharge Dourado)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.68, location=(0.44, 0.05, 1.15))
    r_arm = bpy.context.active_object
    r_arm.name = "Gustave_MechanicalArm"
    r_arm.data.materials.append(mat_gold)

    # Pistão / Núcleo de Energia Ciano do Braço
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0.44, 0.15, 1.15))
    core = bpy.context.active_object
    core.name = "Gustave_EnergyCore"
    core.data.materials.append(mat_cyan_glow)

    # 5. Pernas
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.75, location=(-0.16, 0, 0.45))
    l_leg = bpy.context.active_object
    l_leg.name = "Gustave_LeftLeg"
    l_leg.data.materials.append(mat_pants)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.75, location=(0.16, 0, 0.45))
    r_leg = bpy.context.active_object
    r_leg.name = "Gustave_RightLeg"
    r_leg.data.materials.append(mat_pants)

    # Botas
    bpy.ops.mesh.primitive_cube_add(size=0.22, location=(-0.16, 0.05, 0.11))
    l_boot = bpy.context.active_object
    l_boot.scale = (0.8, 1.3, 0.8)
    l_boot.data.materials.append(mat_boots)

    bpy.ops.mesh.primitive_cube_add(size=0.22, location=(0.16, 0.05, 0.11))
    r_boot = bpy.context.active_object
    r_boot.scale = (0.8, 1.3, 0.8)
    r_boot.data.materials.append(mat_boots)

    # Unir em um único objeto de personagem
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    gustave = bpy.context.active_object
    gustave.name = "Gustave_Model"

    return gustave

def export_fbx(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=False,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options='FBX_SCALE_ALL',
        bake_space_transform=True,
        object_types={'MESH'}
    )
    print(f"Exportado com sucesso: {filepath}")

if __name__ == "__main__":
    out_path = r"c:\Users\fogoy\Fight Game\UnityProject\Assets\Models\Gustave.fbx"
    create_gustave()
    export_fbx(out_path)
