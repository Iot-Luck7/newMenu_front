import React, {useState} from 'react';
import {
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getStoredUserData} from '../services/auth';
import {submitReview} from '../services/review';
import ReviewForm from '../components/review/ReviewForm';
import {RootStackParamList} from '../navigation/MainStack';
import * as ImagePicker from 'expo-image-picker';
import {analyzeReceiptOCR, extractReceiptInfo} from '../utils/ocr';
import {Ionicons} from '@expo/vector-icons';
const uploadToCloudinary = async (fileUri: string) => {
  const data = new FormData();
  data.append('file', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);
  data.append('upload_preset', 'menu_image');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dfb4meubq/image/upload',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: data,
    },
  );

  return await res.json();
};

type ReviewWriteRouteProp = RouteProp<RootStackParamList, 'ReviewWrite'>;

const ReviewWriteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ReviewWriteRouteProp>();
  const {menuId, menuName, imageUrl, brandName} = route.params;

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [taste, setTaste] = useState('');
  const [amount, setAmount] = useState('');
  const [wouldVisitAgain, setWouldVisitAgain] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      setLoading(true); // 로딩 시작

      try {
        const ocrTexts = await analyzeReceiptOCR(localUri);
        const info = extractReceiptInfo(ocrTexts, brandName);

        if (info) {
          console.log('✅ 매장:', info.storeName);
          console.log('🛒 상품 목록:', info.products);
        } else {
          Alert.alert('영수증에 해당 매장명이 없습니다.');
        }

        const cloudinaryRes = await uploadToCloudinary(localUri);
        const uploadedUrl = cloudinaryRes.secure_url;
        setImageUrls(prev => [...prev, uploadedUrl]);
      } catch (error) {
        console.error('OCR 처리 중 오류:', error);
        Alert.alert('OCR 처리 실패');
      } finally {
        setLoading(false); // 로딩 종료
      }
    }
  };

  const handleSubmit = async () => {
    const userData = await getStoredUserData();
    if (!userData) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }

    try {
      await submitReview({
        menuId,
        userId: userData.userId,
        reviewContent: content,
        reviewRating: rating,
        taste,
        amount,
        wouldVisitAgain,
        imageUrls,
      });

      Alert.alert('리뷰가 등록되었습니다!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 리뷰 등록 오류:', error);
      Alert.alert('리뷰 등록 중 오류 발생');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <SafeAreaView style={styles.container}>
        <View style={styles.backHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ReviewForm
            menuName={menuName}
            imageUrl={imageUrl}
            rating={rating}
            setRating={setRating}
            content={content}
            setContent={setContent}
            taste={taste}
            setTaste={setTaste}
            amount={amount}
            setAmount={setAmount}
            wouldVisitAgain={wouldVisitAgain}
            setWouldVisitAgain={setWouldVisitAgain}
            imageUrls={imageUrls}
            setImageUrls={setImageUrls}
            onSubmit={handleSubmit}
            onPickImage={pickImage}
          />
        </ScrollView>

        {/* 🔥 로딩 오버레이 */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  scrollContent: {padding: 20, paddingBottom: 40},
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

export default ReviewWriteScreen;
