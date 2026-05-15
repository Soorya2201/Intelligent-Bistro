import React from 'react';
import { View, Text } from 'react-native';
import { useStore } from '../../store';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface OrderRecapProps {
  narrationText: string;
}

export default function OrderRecap({ narrationText }: OrderRecapProps) {
  const items = useStore(state => state.items);
  const total = useStore(state => state.getTotal());

  return (
    <View style={{ flex: 1 }}>
      {/* Narration Area */}
      <View style={{ 
        backgroundColor: COLORS.bistroCream, 
        padding: SPACING.md, 
        borderRadius: RADIUS.md, 
        marginBottom: SPACING.lg 
      }}>
        <Text style={[TYPOGRAPHY.subheading, { color: COLORS.bistroAccent, marginBottom: SPACING.xs }]}>
          Bistro AI
        </Text>
        <Text style={[TYPOGRAPHY.body, { fontStyle: 'italic' }]}>
          {narrationText || "Reviewing your order..."}
        </Text>
      </View>

      {/* Receipt Card */}
      <View style={{ 
        backgroundColor: COLORS.white, 
        padding: SPACING.lg, 
        borderRadius: RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={[TYPOGRAPHY.heading, { textAlign: 'center', marginBottom: SPACING.md }]}>Receipt</Text>
        
        {items.map(item => (
          <View key={item.menuItem.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
            <Text style={TYPOGRAPHY.body}>{item.quantity}x {item.menuItem.name}</Text>
            <Text style={TYPOGRAPHY.body}>${(item.menuItem.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ 
          borderTopWidth: 1, 
          borderStyle: 'dashed', 
          borderColor: COLORS.medGray, 
          marginVertical: SPACING.md 
        }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={TYPOGRAPHY.heading}>Total</Text>
          <Text style={TYPOGRAPHY.price}>${total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}
