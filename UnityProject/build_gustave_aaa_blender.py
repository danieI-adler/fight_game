import bpy
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, specular=0.5, emission=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = specular
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = specular
        if emission:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission
                bsdf.inputs["Emission Strength"].default_value = emission_strength
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission
    return mat

def build_gustave_aaa():
    reset_scene()

    # --- MATERIAIS DE ALTA FIDELIDADE (PBR SANDFALL CANONICAL) ---
    mat_black_coat = create_pbr_material("M_Coat_TrenchBlack", (0.035, 0.035, 0.045, 1.0), 0.08, 0.72)
    mat_gold_ornament = create_pbr_material("M_Gold_Ornaments", (0.94, 0.76, 0.22, 1.0), 0.96, 0.22)
    mat_purple_vest = create_pbr_material("M_Vest_PurpleVelvet", (0.18, 0.05, 0.24, 1.0), 0.12, 0.58)
    mat_dark_denim = create_pbr_material("M_Pants_DarkDenim", (0.06, 0.07, 0.10, 1.0), 0.04, 0.82)
    mat_leather_straps = create_pbr_material("M_Leather_Harness", (0.08, 0.05, 0.04, 1.0), 0.25, 0.42)
    mat_mech_dark_metal = create_pbr_material("M_Mech_DarkSteel", (0.12, 0.13, 0.15, 1.0), 0.95, 0.25)
    mat_mech_brass_gold = create_pbr_material("M_Mech_BrassGold", (0.95, 0.78, 0.24, 1.0), 0.95, 0.18)
    mat_cyan_arc_core = create_pbr_material("M_Overcharge_CyanCore", (0.15, 0.85, 1.0, 1.0), 0.0, 0.05, 0.5, (0.15, 0.85, 1.0, 1.0), 4.5)
    mat_skin = create_pbr_material("M_Skin_Realistic", (0.92, 0.76, 0.65, 1.0), 0.0, 0.52)
    mat_hair = create_pbr_material("M_Hair_Brown", (0.12, 0.07, 0.04, 1.0), 0.0, 0.88)

    # 1. TRONCO E COLETE ROXO COM ABOTOADURA CANÔNICA
    bpy.ops.mesh.primitive_cylinder_add(radius=0.29, depth=0.68, location=(0, 0, 1.15))
    torso = bpy.context.active_object
    torso.name = "Torso_Vest"
    torso.scale = (1.05, 0.88, 1.0)
    torso.data.materials.append(mat_purple_vest)

    # Abotoaduras douradas duplas na frente
    for i in range(6):
        z_pos = 1.38 - i * 0.07
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, location=(0.07, 0.22, z_pos))
        btn_r = bpy.context.active_object
        btn_r.data.materials.append(mat_gold_ornament)

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.016, location=(-0.07, 0.22, z_pos))
        btn_l = bpy.context.active_object
        btn_l.data.materials.append(mat_gold_ornament)

    # 2. SOBRETUDO ABERTO (TRENCHCOAT) COM BORDADOS DOURADOS
    bpy.ops.mesh.primitive_cylinder_add(radius=0.33, depth=0.88, location=(0, -0.04, 0.72))
    coat = bpy.context.active_object
    coat.name = "Coat_Tails"
    coat.scale = (1.12, 0.95, 1.0)
    coat.data.materials.append(mat_black_coat)

    # Barra inferior dourada do sobretudo
    bpy.ops.mesh.primitive_torus_add(major_radius=0.34, minor_radius=0.018, location=(0, -0.04, 0.30))
    coat_trim = bpy.context.active_object
    coat_trim.scale = (1.12, 0.95, 1.0)
    coat_trim.data.materials.append(mat_gold_ornament)

    # 3. GOLA / CACHECOL PRETO (COWL) NO PESCOÇO
    bpy.ops.mesh.primitive_torus_add(major_radius=0.21, minor_radius=0.075, location=(0, 0, 1.48))
    scarf = bpy.context.active_object
    scarf.name = "Cowl_Scarf"
    scarf.data.materials.append(mat_black_coat)

    # 4. OMBREIRA DIREITA GILDED (DETALHES EM OURO CANÔNICOS)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, location=(0.40, 0.02, 1.44))
    pauldron = bpy.context.active_object
    pauldron.name = "Pauldron_Gilded_Right"
    pauldron.scale = (0.85, 1.15, 0.8)
    pauldron.data.materials.append(mat_gold_ornament)

    # 3 Anéis dourados no braço direito
    for i in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.11, minor_radius=0.018, location=(0.42, 0.02, 1.30 - i * 0.07))
        ring = bpy.context.active_object
        ring.data.materials.append(mat_gold_ornament)

    # Manga do braço direito
    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.68, location=(0.42, 0.02, 1.12))
    r_arm = bpy.context.active_object
    r_arm.name = "Arm_Right"
    r_arm.data.materials.append(mat_black_coat)

    # 5. BRAÇO MECÂNICO ESQUERDO OVERCHARGE (ARTICULAÇÕES DE LATÃO + AÇO ESCURO)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.088, depth=0.72, location=(-0.42, 0.02, 1.12))
    l_arm_mech = bpy.context.active_object
    l_arm_mech.name = "Mechanical_Arm_Base"
    l_arm_mech.data.materials.append(mat_mech_dark_metal)

    # Cilindro / Pistão de Latão Dourado
    bpy.ops.mesh.primitive_cylinder_add(radius=0.038, depth=0.48, location=(-0.46, 0.06, 1.08))
    piston = bpy.context.active_object
    piston.name = "Mechanical_Piston_Gold"
    piston.data.materials.append(mat_mech_brass_gold)

    # Manopla e Falanges Articuladas
    bpy.ops.mesh.primitive_cube_add(size=0.15, location=(-0.42, 0.04, 0.72))
    hand_mech = bpy.context.active_object
    hand_mech.name = "Mechanical_Gauntlet"
    hand_mech.scale = (0.7, 1.15, 0.85)
    hand_mech.data.materials.append(mat_mech_dark_metal)

    # Núcleo de Energia Elétrica Ciano Brilhante (Emissivo Chiaroscuro)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(-0.42, 0.12, 1.14))
    core = bpy.context.active_object
    core.name = "Energy_Core_Cyan"
    core.data.materials.append(mat_cyan_arc_core)

    # 6. CABEÇA REALISTA, CABELOS ONDULADOS E BIGODE
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20, location=(0, 0, 1.68))
    head = bpy.context.active_object
    head.name = "Head_Base"
    head.scale = (0.88, 1.04, 1.0)
    head.data.materials.append(mat_skin)

    # Cabelo ondulado superior
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, -0.03, 1.76))
    hair = bpy.context.active_object
    hair.name = "Hair_Sculpted"
    hair.scale = (0.95, 1.02, 0.82)
    hair.data.materials.append(mat_hair)

    # Mechas laterais
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(side * 0.18, -0.02, 1.68))
        side_hair = bpy.context.active_object
        side_hair.scale = (0.7, 1.15, 1.1)
        side_hair.data.materials.append(mat_hair)

    # Bigode característico
    bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.19, location=(0, 0.19, 1.61))
    mustache = bpy.context.active_object
    mustache.name = "Mustache"
    mustache.rotation_euler = (0, math.radians(90), 0)
    mustache.data.materials.append(mat_hair)

    # Cavanhaque
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(0, 0.18, 1.54))
    beard = bpy.context.active_object
    beard.data.materials.append(mat_hair)

    # 7. MOCHILA DA EXPEDIÇÃO (BACKPACK) & CORREIAS DE COURO
    bpy.ops.mesh.primitive_cube_add(size=0.32, location=(0, -0.26, 1.28))
    pack = bpy.context.active_object
    pack.name = "Expedition_Pack_Back"
    pack.scale = (0.92, 0.58, 1.08)
    pack.rotation_euler = (math.radians(-12), 0, 0)
    pack.data.materials.append(mat_black_coat)

    # Tiras e correias de couro cruzadas no peitoral
    bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0, 0.18, 1.22))
    harness = bpy.context.active_object
    harness.name = "Leather_Harness"
    harness.scale = (9.2, 0.2, 0.8)
    harness.rotation_euler = (0, 0, math.radians(40))
    harness.data.materials.append(mat_leather_straps)

    # 8. PERNAS, CALÇAS ESCURAS, FAIXAS DOURADAS NA COXA E CANELEIRAS
    for side in [-1, 1]:
        # Calça
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.75, location=(side * 0.16, 0, 0.48))
        leg = bpy.context.active_object
        leg.name = f"Leg_{side}"
        leg.data.materials.append(mat_dark_denim)

        # Faixa dourada na coxa
        bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.016, location=(side * 0.16, 0, 0.68))
        thigh_trim = bpy.context.active_object
        thigh_trim.data.materials.append(mat_gold_ornament)

        # Bandagens / Caneleiras de couro nos tornozelos
        bpy.ops.mesh.primitive_cylinder_add(radius=0.095, depth=0.34, location=(side * 0.16, 0.02, 0.28))
        gaiters = bpy.context.active_object
        gaiters.data.materials.append(mat_leather_straps)

        # Botas táticas Belle Époque
        bpy.ops.mesh.primitive_cube_add(size=0.22, location=(side * 0.16, 0.06, 0.11))
        boot = bpy.context.active_object
        boot.scale = (0.75, 1.35, 0.85)
        boot.data.materials.append(mat_leather_straps)

    # 9. UNIR HIERARQUIA & EXPORTAR FBX OTIMIZADO
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    gustave = bpy.context.active_object
    gustave.name = "Gustave_ClairObscur_AAA"

    # Criar UV Unwrap automático de alta precisão
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')

    return gustave

def export_model(filepath):
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
    print(f"Modelo AAA exportado com sucesso para Unity: {filepath}")

if __name__ == "__main__":
    out_fbx = r"c:\Users\fogoy\Fight Game\UnityProject\Assets\Models\Gustave.fbx"
    build_gustave_aaa()
    export_model(out_fbx)
