import { graphql, navigate } from 'gatsby';
import React, { useEffect, useRef, useState } from 'react';
import Helmet from 'react-helmet';
import { ObserveKeys } from 'react-hotkeys';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import type { Dispatch } from 'redux';
import { createSelector } from 'reselect';
import { Container, Col, Row, Button, Quiz, useQuiz } from '@freecodecamp/ui';

// Local Utilities
import { shuffleArray } from '../../../../../shared/utils/shuffle-array';
import Spacer from '../../../components/helpers/spacer';
import LearnLayout from '../../../components/layouts/learn';
import { ChallengeNode, ChallengeMeta, Test } from '../../../redux/prop-types';
import ChallengeDescription from '../components/challenge-description';
import Hotkeys from '../components/hotkeys';
import ChallengeTitle from '../components/challenge-title';
import CompletionModal from '../components/completion-modal';
import {
  challengeMounted,
  updateChallengeMeta,
  openModal,
  closeModal,
  updateSolutionFormValues,
  initTests
} from '../redux/actions';
import { isChallengeCompletedSelector } from '../redux/selectors';
import PrismFormatted from '../components/prism-formatted';
import ExitQuizModal from './exit-quiz-modal';
import FinishQuizModal from './finish-quiz-modal';

import './show.css';

// Redux Setup
const mapStateToProps = createSelector(
  isChallengeCompletedSelector,
  (isChallengeCompleted: boolean) => ({
    isChallengeCompleted
  })
);
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      initTests,
      updateChallengeMeta,
      challengeMounted,
      updateSolutionFormValues,
      openCompletionModal: () => openModal('completion'),
      openExitQuizModal: () => openModal('exitQuiz'),
      closeExitQuizModal: () => closeModal('exitQuiz'),
      openFinishQuizModal: () => openModal('finishQuiz'),
      closeFinishQuizModal: () => closeModal('finishQuiz')
    },
    dispatch
  );

// Types
interface ShowQuizProps {
  challengeMounted: (arg0: string) => void;
  data: { challengeNode: ChallengeNode };
  description: string;
  initTests: (xs: Test[]) => void;
  isChallengeCompleted: boolean;
  openCompletionModal: () => void;
  pageContext: {
    challengeMeta: ChallengeMeta;
  };
  updateChallengeMeta: (arg0: ChallengeMeta) => void;
  updateSolutionFormValues: () => void;
  openExitQuizModal: () => void;
  closeExitQuizModal: () => void;
  openFinishQuizModal: () => void;
  closeFinishQuizModal: () => void;
}

const ShowQuiz = ({
  challengeMounted,
  data: {
    challengeNode: {
      challenge: {
        fields: { tests, blockHashSlug },
        title,
        description,
        challengeType,
        helpCategory,
        superBlock,
        block,
        translationPending,
        quizzes
      }
    }
  },
  pageContext: { challengeMeta },
  initTests,
  updateChallengeMeta,
  openCompletionModal,
  isChallengeCompleted,
  openExitQuizModal,
  closeExitQuizModal,
  openFinishQuizModal,
  closeFinishQuizModal
}: ShowQuizProps) => {
  const { t } = useTranslation();
  const { nextChallengePath, prevChallengePath } = challengeMeta;
  const container = useRef<HTMLElement | null>(null);

  // Campers are not allowed to change their answers once the quiz is submitted.
  // `hasSubmitted` is used as a flag to disable the quiz.
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // `isPassed` is used as a flag to conditionally render the test or submit button.
  const [isPassed, setIsPassed] = useState(false);

  const [message, setMessage] = useState<string>('');

  const blockNameTitle = `${t(
    `intro:${superBlock}.blocks.${block}.title`
  )} - ${title}`;

  const [quizId] = useState(Math.floor(Math.random() * quizzes.length));
  const quiz = quizzes[quizId].questions;

  // Initialize the data passed to `useQuiz`
  const [initialQuizData] = useState(
    quiz.map(question => {
      const distractors = question.distractors.map((distractor, index) => {
        return {
          label: (
            <PrismFormatted className='quiz-answer-label' text={distractor} />
          ),
          value: index + 1
        };
      });

      const answer = {
        label: (
          <PrismFormatted
            className='quiz-answer-label'
            text={question.answer}
          />
        ),
        value: 4
      };

      return {
        question: <PrismFormatted text={question.text} />,
        answers: shuffleArray([...distractors, answer]),
        correctAnswer: answer.value
      };
    })
  );

  const { questions: quizData, validateAnswers } = useQuiz({
    initialQuestions: initialQuizData,
    validationMessages: {
      correct: t('learn.quiz.correct-answer'),
      incorrect: t('learn.quiz.incorrect-answer')
    },
    onSuccess: () => {
      openCompletionModal();
      setIsPassed(true);
    },
    onFailure: () => setIsPassed(false)
  });

  useEffect(() => {
    initTests(tests);
    updateChallengeMeta({
      ...challengeMeta,
      title,
      challengeType,
      helpCategory
    });
    challengeMounted(challengeMeta.id);
    container.current?.focus();
    // This effect should be run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateChallengeMeta({
      ...challengeMeta,
      title,
      challengeType,
      helpCategory
    });
    challengeMounted(challengeMeta.id);
  }, [
    title,
    challengeMeta,
    challengeType,
    helpCategory,
    challengeMounted,
    updateChallengeMeta
  ]);

  const handleFinishQuiz = () => {
    const unansweredList = quizData.reduce<number[]>(
      (acc, curr, id) => (curr.selectedAnswer == null ? [...acc, id + 1] : acc),
      []
    );

    if (unansweredList.length > 0) {
      setMessage(
        t('learn.quiz.unanswered-questions', {
          unansweredQuestions: unansweredList.join(', ')
        })
      );

      return;
    }

    setMessage('');
    openFinishQuizModal();
  };

  const handleFinishQuizModalBtnClick = () => {
    validateAnswers();
    setHasSubmitted(true);

    const correctCount = quizData.reduce(
      (acc, curr) =>
        curr.selectedAnswer === curr.correctAnswer ? (acc += 1) : acc,
      0
    );

    // TODO: Update the message to include link(s) to the review materials
    // in the case campers didn't pass the quiz.
    setMessage(
      t('learn.quiz.have-n-correct-questions', {
        correctAnswerCount: correctCount,
        total: quiz.length
      })
    );

    closeFinishQuizModal();
  };

  const handleSubmitAndGo = () => {
    openCompletionModal();
  };

  const handleExitQuiz = () => {
    // If campers have submitted and not passed,
    // there aren't any actions left other than leaving the quiz, so a prompt isn't needed.
    if (hasSubmitted && !isPassed) {
      void navigate(blockHashSlug);
    } else {
      openExitQuizModal();
    }
  };

  const handleExitQuizModalBtnClick = () => {
    void navigate(blockHashSlug);
    closeExitQuizModal();
  };

  return (
    <Hotkeys
      executeChallenge={!isPassed ? handleFinishQuiz : handleSubmitAndGo}
      containerRef={container}
      nextChallengePath={nextChallengePath}
      prevChallengePath={prevChallengePath}
    >
      <LearnLayout>
        <Helmet
          title={`${blockNameTitle} | ${t('learn.learn')} | freeCodeCamp.org`}
        />
        <Container className='quiz-challenge-container'>
          <Row>
            <Spacer size='medium' />
            <ChallengeTitle
              isCompleted={isChallengeCompleted}
              translationPending={translationPending}
            >
              {title}
            </ChallengeTitle>

            <Col md={8} mdOffset={2} sm={10} smOffset={1} xs={12}>
              <ChallengeDescription description={description} />
              <ObserveKeys>
                <Quiz questions={quizData} disabled={hasSubmitted} />
              </ObserveKeys>
              <Spacer size='medium' />
              <div aria-live='polite' aria-atomic='true'>
                {message}
              </div>
              <Spacer size='medium' />
              {!isPassed ? (
                <>
                  <Button
                    block={true}
                    variant='primary'
                    onClick={handleFinishQuiz}
                    disabled={hasSubmitted}
                  >
                    {t('buttons.finish-quiz')}
                  </Button>
                </>
              ) : (
                <Button
                  block={true}
                  variant='primary'
                  onClick={handleSubmitAndGo}
                >
                  {t('buttons.submit-and-go')}
                </Button>
              )}
              <Spacer size='xxSmall' />
              <Button block={true} variant='primary' onClick={handleExitQuiz}>
                {t('buttons.exit-quiz')}
              </Button>
              <Spacer size='large' />
            </Col>
            <CompletionModal />
          </Row>
        </Container>
        <ExitQuizModal onExit={handleExitQuizModalBtnClick} />
        <FinishQuizModal onFinish={handleFinishQuizModalBtnClick} />
      </LearnLayout>
    </Hotkeys>
  );
};

ShowQuiz.displayName = 'ShowQuiz';

export default connect(mapStateToProps, mapDispatchToProps)(ShowQuiz);

export const query = graphql`
  query QuizChallenge($id: String!) {
    challengeNode(id: { eq: $id }) {
      challenge {
        title
        description
        challengeType
        helpCategory
        superBlock
        block
        fields {
          blockHashSlug
          blockName
          slug
          tests {
            text
            testString
          }
        }
        quizzes {
          questions {
            distractors
            text
            answer
          }
        }
        translationPending
      }
    }
  }
`;
