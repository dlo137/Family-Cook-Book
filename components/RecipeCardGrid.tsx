import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.68;
const CARD_GAP = 8;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const ROW_STAGGER = 10;
const MARQUEE_DURATION = 140000;

type RecipeCard = {
  id: string;
  title: string;
  note: string;
  ingredients: number;
  time: string;
  image: string;
};

export const RECIPES: RecipeCard[] = [
  // Row 1
  { id: '1',  title: "Sunday Pot Roast",          note: "Every Sunday without fail. Low and slow, always.",                      ingredients: 9,  time: '4h',  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
  { id: '2',  title: "Mom's Vanilla Cupcakes",    note: "She said the secret was extra vanilla extract. She was right.",         ingredients: 7,  time: '1h',  image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400' },
  { id: '3',  title: "Dad's BBQ Ribs",            note: "Fourth of July 2023, everyone asked for it.",                          ingredients: 8,  time: '5h',  image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&fit=crop' },
  { id: '4',  title: "Nana's Apple Pie",          note: "2026 Thanksgiving, best one yet. Extra cinnamon.",                     ingredients: 10, time: '2h',  image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400' },
  // Row 2
  { id: '5',  title: "Christmas Eve Lasagna",     note: "Aunt Carol made this every year. A non-negotiable.",                   ingredients: 12, time: '2h',  image: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=400' },
  { id: '6',  title: "Chicken Soup",              note: "She said the secret was extra vanilla. Pretty sure that was the cake.", ingredients: 11, time: '3h',  image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400' },
  { id: '7',  title: "Grandpa's Chili",           note: "Won the cook-off three years straight.",                               ingredients: 13, time: '2h',  image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400' },
  { id: '8',  title: "Weird but Good Shortbread", note: "Never used a timer once. Always perfect.",                             ingredients: 5,  time: '45m', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
  // Row 3
  { id: '9',  title: "Saturday Pancakes",         note: "Uncle Ray flipped them way too high on purpose. Every time.",          ingredients: 6,  time: '30m', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400' },
  { id: '10', title: "The Mac & Cheese",          note: "From scratch. 2024 Easter. No going back.",                           ingredients: 8,  time: '45m', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400' },
  { id: '11', title: "Grandma's Sugar Cookies",  note: "She cut them into shapes with old metal cutters. Still have them.",    ingredients: 6,  time: '1h',  image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400' },
  { id: '12', title: "Beef Stew",                 note: "Sis made this once in college and texted asking which potatoes.",      ingredients: 10, time: '3h',  image: 'https://images.unsplash.com/photo-1511910849309-0dffb8785146?w=400' },
  // Row 4
  { id: '13', title: "Papa's Cornbread",          note: "Always slightly burnt on the bottom. That was the point.",             ingredients: 7,  time: '40m', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
  { id: '14', title: "Deviled Eggs",              note: "Every single holiday. Nobody knows whose recipe it is.",               ingredients: 5,  time: '20m', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400' },
  { id: '15', title: "Aunt Jo's Peach Cobbler",  note: "Summer only. She brought it warm in a dish towel.",                   ingredients: 8,  time: '1h',  image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400' },
  { id: '16', title: "(DO NOT MAKE AGAIN) Turkey Meatballs", note: "Cousin Mike made these once and never lived it down. They were good.", ingredients: 9,  time: '1h',  image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400' },
  // Row 5
  { id: '17', title: "Funeral Potatoes",          note: "We made these for every occasion. Not just funerals.",                 ingredients: 7,  time: '1h',  image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
  { id: '18', title: "Pumpkin Bread",             note: "October tradition. The house smelled amazing for hours.",              ingredients: 9,  time: '1h',  image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { id: '19', title: "Uncle Dave's Guacamole",   note: "He mashed it with a fork and got mad if you used a blender.",         ingredients: 5,  time: '15m', image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400' },
  { id: '20', title: "The Green Bean Casserole",  note: "2022 Thanksgiving. Nobody asked for it but everyone finished it.",    ingredients: 6,  time: '50m', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400' },
];


// ─── Marquee Row ──────────────────────────────────────────────────────────────

type MarqueeRowProps = {
  cards: RecipeCard[];
  direction: 'left' | 'right';
  isStaggered: boolean;
  offsetFraction: number;
};

const MarqueeRow: React.FC<MarqueeRowProps> = ({ cards, direction, isStaggered, offsetFraction }) => {
  const looped = [...cards, ...cards, ...cards];
  const loopWidth = cards.length * CARD_STEP;

  const baseFrom = direction === 'left' ? 0 : -loopWidth;
  const initialOffset = -offsetFraction * loopWidth;

  const translateX = useRef(new Animated.Value(baseFrom + initialOffset)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const from = baseFrom + initialOffset;
    const to   = direction === 'left' ? -loopWidth + initialOffset : initialOffset;

    translateX.setValue(from);

    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: to,
        duration: MARQUEE_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animRef.current.start();

    return () => { animRef.current?.stop(); };
  }, []);

  return (
    <View style={[styles.rowClip, isStaggered && styles.rowStaggered]} pointerEvents="none">
      <Animated.View style={[styles.rowInner, { transform: [{ translateX }] }]}>
        {looped.map((card, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardImageWrap}>
              <Image source={{ uri: card.image }} style={styles.cardImage} resizeMode="cover" />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                <Text style={styles.metaTime}>{card.time}</Text>
              </View>
              <Text style={styles.cardNote} numberOfLines={2}>{card.note}</Text>
              <Text style={styles.metaIngredients}>{card.ingredients} ingredients</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

// ─── Grid ─────────────────────────────────────────────────────────────────────

const ROW_OFFSETS = [0, 0.25, 0.34, 0.75, 0.67];
const CARDS_PER_ROW = 4;

type RecipeCardGridProps = {
  recipes?: RecipeCard[];
};

const RecipeCardGrid: React.FC<RecipeCardGridProps> = ({ recipes = RECIPES }) => (
  <View style={styles.container} pointerEvents="none">
    {[0, 1, 2, 3, 4].map((rowIndex) => (
      <MarqueeRow
        key={rowIndex}
        cards={recipes.slice(rowIndex * CARDS_PER_ROW, rowIndex * CARDS_PER_ROW + CARDS_PER_ROW)}
        direction={rowIndex % 2 === 0 ? 'left' : 'right'}
        isStaggered={rowIndex % 2 !== 0}
        offsetFraction={ROW_OFFSETS[rowIndex]}
      />
    ))}
  </View>
);

export default RecipeCardGrid;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: CARD_GAP,
    gap: CARD_GAP,
    overflow: 'hidden',
  },
  rowClip: {
    flex: 1,
    overflow: 'hidden',
  },
  rowStaggered: {
    marginTop: ROW_STAGGER,
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: CARD_GAP,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    alignSelf: 'stretch',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageWrap: {
    width: '45%',
    alignSelf: 'stretch',
  },
  cardImage: { flex: 1 },
  cardBody: { flex: 1, padding: 8, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1a1a1a', lineHeight: 17, textAlign: 'left' },
  metaTime: { fontSize: 10, color: '#999', marginTop: 1 },
  cardNote: { fontSize: 10, color: '#aaa', fontStyle: 'italic', lineHeight: 14 },
  metaIngredients: { fontSize: 10, color: '#999', textAlign: 'left' },
});
