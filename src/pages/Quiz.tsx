import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { criminalArticles } from "@/data/criminalCode";
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  RotateCcw, 
  ArrowRight, 
  Clock,
  Target,
  Flame,
  Award
} from "lucide-react";

interface Question {
  id: string;
  type: "description" | "stars" | "court" | "bail";
  article: typeof criminalArticles[0];
  options: string[];
  correctAnswer: string;
  questionText: string;
}

interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
  bestStreak: number;
  timeSpent: number;
}

const QUESTIONS_PER_QUIZ = 10;

export default function Quiz() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "result">("menu");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    bestStreak: 0,
    timeSpent: 0
  });
  const [startTime, setStartTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Load saved stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("quizStats");
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setStats(prev => ({
        ...prev,
        totalQuestions: parsed.totalQuestions || 0,
        correctAnswers: parsed.correctAnswers || 0,
        wrongAnswers: parsed.wrongAnswers || 0,
        bestStreak: parsed.bestStreak || 0,
        timeSpent: parsed.timeSpent || 0
      }));
    }
  }, []);

  // Save stats to localStorage
  const saveStats = (newStats: QuizStats) => {
    localStorage.setItem("quizStats", JSON.stringify({
      totalQuestions: newStats.totalQuestions,
      correctAnswers: newStats.correctAnswers,
      wrongAnswers: newStats.wrongAnswers,
      bestStreak: newStats.bestStreak,
      timeSpent: newStats.timeSpent
    }));
  };

  const generateQuestions = (): Question[] => {
    const shuffledArticles = [...criminalArticles].sort(() => Math.random() - 0.5);
    const selectedArticles = shuffledArticles.slice(0, QUESTIONS_PER_QUIZ);
    
    return selectedArticles.map((article, index) => {
      const questionTypes: Question["type"][] = difficulty === "easy" 
        ? ["description", "court"] 
        : difficulty === "medium" 
        ? ["description", "stars", "court"] 
        : ["description", "stars", "court", "bail"];
      
      const type = questionTypes[index % questionTypes.length];
      
      switch (type) {
        case "description": {
          const wrongOptions = shuffledArticles
            .filter(a => a.id !== article.id)
            .slice(0, 3)
            .map(a => a.article);
          const options = [...wrongOptions, article.article].sort(() => Math.random() - 0.5);
          return {
            id: `q-${index}`,
            type,
            article,
            options,
            correctAnswer: article.article,
            questionText: `Какая статья соответствует: "${article.description}"?`
          };
        }
        case "stars": {
          const starsOptions = ["1", "2", "3", "4", "5"];
          return {
            id: `q-${index}`,
            type,
            article,
            options: starsOptions,
            correctAnswer: article.stars.toString(),
            questionText: `Какой максимальный уровень розыска по статье "${article.article}"?`
          };
        }
        case "court": {
          return {
            id: `q-${index}`,
            type,
            article,
            options: ["Требуется суд", "Не требуется суд"],
            correctAnswer: article.court ? "Требуется суд" : "Не требуется суд",
            questionText: `Требуется ли суд по статье "${article.article}" (${article.description})?`
          };
        }
        case "bail": {
          const bailOptions = ["$25,000", "$50,000", "$75,000", "Не предусмотрен"];
          const correctBail = article.bail.includes("Не предусмотрен") ? "Не предусмотрен" : article.bail;
          if (!bailOptions.includes(correctBail)) {
            bailOptions[Math.floor(Math.random() * 3)] = correctBail;
          }
          return {
            id: `q-${index}`,
            type,
            article,
            options: bailOptions.sort(() => Math.random() - 0.5),
            correctAnswer: correctBail,
            questionText: `Какой залог предусмотрен по статье "${article.article}"?`
          };
        }
      }
    });
  };

  const startQuiz = () => {
    setQuestions(generateQuestions());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGameState("playing");
    setStartTime(Date.now());
    setStats(prev => ({ ...prev, streak: 0 }));
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    
    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      const newStats = {
        ...prev,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1),
        streak: newStreak,
        bestStreak: newBestStreak
      };
      return newStats;
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      setStats(prev => {
        const newStats = { ...prev, timeSpent: prev.timeSpent + timeSpent };
        saveStats(newStats);
        return newStats;
      });
      setGameState("result");
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  
  const sessionCorrect = useMemo(() => {
    if (gameState !== "result") return 0;
    const sessionAnswers = questions.filter((q, i) => i < QUESTIONS_PER_QUIZ).length;
    return stats.correctAnswers - (stats.totalQuestions - sessionAnswers);
  }, [gameState, questions, stats]);

  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  const resetStats = () => {
    const newStats = {
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      streak: 0,
      bestStreak: 0,
      timeSpent: 0
    };
    setStats(newStats);
    saveStats(newStats);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Тест на знание УК</h1>
            <p className="text-muted-foreground">Проверьте свои знания уголовного кодекса</p>
          </div>
        </div>

        {gameState === "menu" && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                      <p className="text-sm text-muted-foreground">Всего вопросов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{accuracy}%</p>
                      <p className="text-sm text-muted-foreground">Точность</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Flame className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.bestStreak}</p>
                      <p className="text-sm text-muted-foreground">Лучшая серия</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{formatTime(stats.timeSpent)}</p>
                      <p className="text-sm text-muted-foreground">Время в тестах</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Difficulty Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Выберите сложность</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Button
                    variant={difficulty === "easy" ? "default" : "outline"}
                    className="h-auto py-4 flex-col"
                    onClick={() => setDifficulty("easy")}
                  >
                    <span className="text-lg font-bold">Легко</span>
                    <span className="text-xs text-muted-foreground">Статьи и суд</span>
                  </Button>
                  <Button
                    variant={difficulty === "medium" ? "default" : "outline"}
                    className="h-auto py-4 flex-col"
                    onClick={() => setDifficulty("medium")}
                  >
                    <span className="text-lg font-bold">Средне</span>
                    <span className="text-xs text-muted-foreground">+ Уровень розыска</span>
                  </Button>
                  <Button
                    variant={difficulty === "hard" ? "default" : "outline"}
                    className="h-auto py-4 flex-col"
                    onClick={() => setDifficulty("hard")}
                  >
                    <span className="text-lg font-bold">Сложно</span>
                    <span className="text-xs text-muted-foreground">+ Залог</span>
                  </Button>
                </div>
                
                <Button onClick={startQuiz} size="lg" className="w-full">
                  <Brain className="mr-2 h-5 w-5" />
                  Начать тест ({QUESTIONS_PER_QUIZ} вопросов)
                </Button>
                
                {stats.totalQuestions > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetStats} className="w-full text-muted-foreground">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Сбросить статистику
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === "playing" && currentQuestion && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
                <div className="flex items-center gap-2">
                  {stats.streak > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {stats.streak}
                    </Badge>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  {currentQuestion.type === "description" && "Определите статью"}
                  {currentQuestion.type === "stars" && "Уровень розыска"}
                  {currentQuestion.type === "court" && "Требование суда"}
                  {currentQuestion.type === "bail" && "Размер залога"}
                </Badge>
                <CardTitle className="text-xl leading-relaxed">
                  {currentQuestion.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const isSelected = option === selectedAnswer;
                  
                  let buttonClass = "w-full justify-start text-left h-auto py-4 px-4";
                  if (isAnswered) {
                    if (isCorrect) {
                      buttonClass += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                    } else if (isSelected && !isCorrect) {
                      buttonClass += " bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                    }
                  }
                  
                  return (
                    <Button
                      key={option}
                      variant="outline"
                      className={buttonClass}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnswered}
                    >
                      <span className="flex items-center gap-2">
                        {isAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                        {currentQuestion.type === "stars" ? `${"⭐".repeat(parseInt(option))} (${option})` : option}
                      </span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Next Button */}
            {isAnswered && (
              <Button onClick={nextQuestion} size="lg" className="w-full">
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Следующий вопрос
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    Завершить тест
                    <Trophy className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {gameState === "result" && (
          <div className="space-y-6">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold mb-2">Тест завершён!</h2>
                <p className="text-muted-foreground mb-6">
                  Вы ответили на {QUESTIONS_PER_QUIZ} вопросов
                </p>
                
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">{stats.correctAnswers - (stats.totalQuestions - QUESTIONS_PER_QUIZ)}</p>
                    <p className="text-sm text-muted-foreground">Правильно</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold text-red-600">{QUESTIONS_PER_QUIZ - (stats.correctAnswers - (stats.totalQuestions - QUESTIONS_PER_QUIZ))}</p>
                    <p className="text-sm text-muted-foreground">Неправильно</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10">
                    <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold text-orange-600">{stats.bestStreak}</p>
                    <p className="text-sm text-muted-foreground">Лучшая серия</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={startQuiz} size="lg">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Пройти ещё раз
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setGameState("menu")}>
                    В меню
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Achievement hint */}
            {accuracy >= 80 && (
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="pt-6 flex items-center gap-4">
                  <Award className="h-12 w-12 text-yellow-500" />
                  <div>
                    <p className="font-bold text-lg">Отличный результат!</p>
                    <p className="text-muted-foreground">
                      Ваша общая точность: {accuracy}%. Вы хорошо знаете уголовный кодекс!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
