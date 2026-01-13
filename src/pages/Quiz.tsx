import { useState, useEffect } from "react";
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
  Award,
  Download,
  FileText
} from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

interface Question {
  id: string;
  type: "description" | "stars" | "court" | "bail";
  article: typeof criminalArticles[0];
  options: string[];
  correctAnswer: string;
  questionText: string;
}

interface AnswerRecord {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
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
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
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

  // Fisher-Yates shuffle for true randomization
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateQuestions = (): Question[] => {
    // True random shuffle using Fisher-Yates
    const shuffledArticles = shuffleArray(criminalArticles);
    const selectedArticles = shuffledArticles.slice(0, QUESTIONS_PER_QUIZ);
    
    // Randomize question types for each question
    const questionTypes: Question["type"][] = difficulty === "easy" 
      ? ["description", "court"] 
      : difficulty === "medium" 
      ? ["description", "stars", "court"] 
      : ["description", "stars", "court", "bail"];
    
    return selectedArticles.map((article, index) => {
      // Random type selection for each question
      const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      
      switch (type) {
        case "description": {
          const otherArticles = shuffleArray(shuffledArticles.filter(a => a.id !== article.id));
          const wrongOptions = otherArticles.slice(0, 3).map(a => a.article);
          const options = shuffleArray([...wrongOptions, article.article]);
          return {
            id: `q-${index}-${Date.now()}`,
            type,
            article,
            options,
            correctAnswer: article.article,
            questionText: `Какая статья соответствует: "${article.description}"?`
          };
        }
        case "stars": {
          const starsOptions = shuffleArray(["1", "2", "3", "4", "5"]);
          return {
            id: `q-${index}-${Date.now()}`,
            type,
            article,
            options: starsOptions,
            correctAnswer: article.stars.toString(),
            questionText: `Какой максимальный уровень розыска по статье "${article.article}"?`
          };
        }
        case "court": {
          return {
            id: `q-${index}-${Date.now()}`,
            type,
            article,
            options: shuffleArray(["Требуется суд", "Не требуется суд"]),
            correctAnswer: article.court ? "Требуется суд" : "Не требуется суд",
            questionText: `Требуется ли суд по статье "${article.article}" (${article.description})?`
          };
        }
        case "bail": {
          let bailOptions = ["$25,000", "$50,000", "$75,000", "Не предусмотрен"];
          const correctBail = article.bail.includes("Не предусмотрен") ? "Не предусмотрен" : article.bail;
          if (!bailOptions.includes(correctBail)) {
            bailOptions[Math.floor(Math.random() * 3)] = correctBail;
          }
          return {
            id: `q-${index}-${Date.now()}`,
            type,
            article,
            options: shuffleArray(bailOptions),
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
    setAnswerHistory([]);
    setGameState("playing");
    setStartTime(Date.now());
    setStats(prev => ({ ...prev, streak: 0 }));
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answer === currentQ.correctAnswer;
    
    // Record answer
    setAnswerHistory(prev => [...prev, {
      question: currentQ,
      userAnswer: answer,
      isCorrect
    }]);
    
    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      return {
        ...prev,
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (isCorrect ? 0 : 1),
        streak: newStreak,
        bestStreak: newBestStreak
      };
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      setSessionTime(timeSpent);
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
  
  const sessionCorrect = answerHistory.filter(a => a.isCorrect).length;
  const sessionWrong = answerHistory.filter(a => !a.isCorrect).length;

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

  const downloadPDF = () => {
    const date = new Date().toLocaleDateString('ru-RU');
    const time = new Date().toLocaleTimeString('ru-RU');
    
    const difficultyLabels = {
      easy: "Лёгкий",
      medium: "Средний", 
      hard: "Сложный"
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Результаты теста УК - ${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            background: #f5f5f5;
            color: #333;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header h1 { 
            color: #1a1a2e; 
            font-size: 28px;
            margin-bottom: 8px;
          }
          .header p { color: #666; font-size: 14px; }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            margin-bottom: 30px; 
          }
          .stat-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            border: 1px solid #e9ecef;
          }
          .stat-card .value { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1a1a2e;
          }
          .stat-card .label { 
            font-size: 12px; 
            color: #666;
            margin-top: 5px;
          }
          .stat-card.correct { background: #d4edda; border-color: #c3e6cb; }
          .stat-card.correct .value { color: #28a745; }
          .stat-card.wrong { background: #f8d7da; border-color: #f5c6cb; }
          .stat-card.wrong .value { color: #dc3545; }
          .questions-section h2 { 
            font-size: 20px; 
            margin-bottom: 20px;
            color: #1a1a2e;
          }
          .question { 
            margin-bottom: 20px; 
            padding: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 10px;
            page-break-inside: avoid;
          }
          .question.correct { border-left: 4px solid #28a745; background: #f8fff9; }
          .question.wrong { border-left: 4px solid #dc3545; background: #fff8f8; }
          .question-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 10px;
          }
          .question-number { 
            font-weight: bold; 
            color: #666;
            font-size: 14px;
          }
          .question-status { 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: bold;
          }
          .question-status.correct { background: #28a745; color: white; }
          .question-status.wrong { background: #dc3545; color: white; }
          .question-text { 
            font-size: 15px; 
            margin-bottom: 12px;
            color: #333;
            line-height: 1.5;
          }
          .answer-row { 
            font-size: 14px;
            padding: 8px 0;
            border-top: 1px solid #e9ecef;
          }
          .answer-row:first-of-type { border-top: none; }
          .answer-label { color: #666; font-weight: 500; }
          .answer-value { color: #333; }
          .answer-value.correct-answer { color: #28a745; font-weight: bold; }
          .answer-value.user-wrong { color: #dc3545; text-decoration: line-through; }
          .footer { 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e5e5;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; background: white; }
            .container { box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Результаты теста на знание УК</h1>
            <p>Дата: ${date} | Время: ${time} | Сложность: ${difficultyLabels[difficulty]}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card correct">
              <div class="value">${sessionCorrect}</div>
              <div class="label">Правильно</div>
            </div>
            <div class="stat-card wrong">
              <div class="value">${sessionWrong}</div>
              <div class="label">Неправильно</div>
            </div>
            <div class="stat-card">
              <div class="value">${Math.round((sessionCorrect / QUESTIONS_PER_QUIZ) * 100)}%</div>
              <div class="label">Точность</div>
            </div>
            <div class="stat-card">
              <div class="value">${formatTime(sessionTime)}</div>
              <div class="label">Время</div>
            </div>
          </div>

          <div class="questions-section">
            <h2>📋 Детальные результаты</h2>
            ${answerHistory.map((record, index) => `
              <div class="question ${record.isCorrect ? 'correct' : 'wrong'}">
                <div class="question-header">
                  <span class="question-number">Вопрос ${index + 1}</span>
                  <span class="question-status ${record.isCorrect ? 'correct' : 'wrong'}">
                    ${record.isCorrect ? '✓ Верно' : '✗ Неверно'}
                  </span>
                </div>
                <div class="question-text">${record.question.questionText}</div>
                <div class="answer-row">
                  <span class="answer-label">Ваш ответ: </span>
                  <span class="answer-value ${record.isCorrect ? '' : 'user-wrong'}">${record.userAnswer}</span>
                </div>
                ${!record.isCorrect ? `
                  <div class="answer-row">
                    <span class="answer-label">Правильный ответ: </span>
                    <span class="answer-value correct-answer">${record.question.correctAnswer}</span>
                  </div>
                ` : ''}
                <div class="answer-row">
                  <span class="answer-label">Статья: </span>
                  <span class="answer-value">${record.question.article.article} - ${record.question.article.description}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Denver | Majestic RP - Справочник законов</p>
            <p>Создано: ${date} ${time}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto print after loading
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
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
                  Время: {formatTime(sessionTime)}
                </p>
                
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">{sessionCorrect}</p>
                    <p className="text-sm text-muted-foreground">Правильно</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold text-red-600">{sessionWrong}</p>
                    <p className="text-sm text-muted-foreground">Неправильно</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10">
                    <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold text-blue-600">{Math.round((sessionCorrect / QUESTIONS_PER_QUIZ) * 100)}%</p>
                    <p className="text-sm text-muted-foreground">Точность</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={startQuiz} size="lg">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Пройти ещё раз
                  </Button>
                  <Button variant="outline" size="lg" onClick={downloadPDF}>
                    <Download className="mr-2 h-5 w-5" />
                    Скачать PDF
                  </Button>
                  <Button variant="ghost" size="lg" onClick={() => setGameState("menu")}>
                    В меню
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Детальные результаты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {answerHistory.map((record, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      record.isCorrect 
                        ? 'border-l-green-500 bg-green-500/5' 
                        : 'border-l-red-500 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Вопрос {index + 1}</span>
                      <Badge variant={record.isCorrect ? "default" : "destructive"}>
                        {record.isCorrect ? "Верно" : "Неверно"}
                      </Badge>
                    </div>
                    <p className="font-medium mb-2">{record.question.questionText}</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Ваш ответ: </span>
                        <span className={record.isCorrect ? "text-green-600" : "text-red-600 line-through"}>
                          {record.userAnswer}
                        </span>
                      </p>
                      {!record.isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Правильный ответ: </span>
                          <span className="text-green-600 font-medium">{record.question.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs mt-2">
                        {record.question.article.article} — {record.question.article.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Achievement hint */}
            {(sessionCorrect / QUESTIONS_PER_QUIZ) >= 0.8 && (
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="pt-6 flex items-center gap-4">
                  <Award className="h-12 w-12 text-yellow-500" />
                  <div>
                    <p className="font-bold text-lg">Отличный результат!</p>
                    <p className="text-muted-foreground">
                      Вы правильно ответили на {sessionCorrect} из {QUESTIONS_PER_QUIZ} вопросов. Отличное знание УК!
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
