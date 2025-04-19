import React, {useState} from 'react';
import {Alert, StyleSheet} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getStoredUserData} from '../services/auth';
import {submitReview} from '../services/review';
import ReviewForm from '../components/review/ReviewForm';
import {RootStackParamList} from '../navigation/MainStack';

type ReviewWriteRouteProp = RouteProp<RootStackParamList, 'ReviewWrite'>;

const ReviewWriteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ReviewWriteRouteProp>();
  const {menuId, menuName} = route.params;

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [taste, setTaste] = useState('');
  const [amount, setAmount] = useState('');
  const [wouldVisitAgain, setWouldVisitAgain] = useState('');

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
      });

      Alert.alert('리뷰가 등록되었습니다!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 리뷰 등록 오류:', error);
      Alert.alert('리뷰 등록 중 오류 발생');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ReviewForm
        menuName={menuName}
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
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#fff'},
});

export default ReviewWriteScreen;
