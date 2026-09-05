using UnityEngine;

namespace FightGame.Data
{
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "FightGame/Character Data")]
    public class CharacterData : ScriptableObject
    {
        [Header("Identificação")]
        public string characterName;
        public Sprite portrait;
        public Color themeColor = Color.cyan;
        public Color secondaryColor = Color.blue;

        [Header("Atributos de Combate")]
        public float maxHealth = 1000f;
        public float moveSpeed = 7.0f;
        public float jumpForce = 14.0f;
        public float attackMultiplier = 1.0f;
        public float defenseMultiplier = 1.0f;

        [Header("Geração de Energia (%)")]
        public float energyGainOnHit = 5.0f;
        public float energyGainOnHurt = 2.5f;

        [Header("Prefab do Modelo")]
        public GameObject characterPrefab;
    }
}
