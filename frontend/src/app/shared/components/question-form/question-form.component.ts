import { Component, HostListener, ViewEncapsulation, OnDestroy } from '@angular/core'
import { FormGroup, FormControl, Validators} from '@angular/forms'
import { Subscription } from 'rxjs'

import { FormsService } from '../../services/forms.service'
import { FormValidators } from '../../form.validators'
import { ClickInt, OrdersInt } from '../../interfaces/interfaces'

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class QuestionFormComponent implements OnDestroy {

  modal_switcher: boolean = false // Свичер для модальных окон новых форм и "ответов" форм

  clicksSub: Subscription // Переменная для подписки на клики по кнопке открытия окна с формой 

  servRespSub: Subscription // Переменная для подписки на ответ сервера после отправки формы 

  switcher_valid: boolean = false // Индикатор попытки валидации формы после клика на кнопку отправки

  switcher: boolean = false // Индикатор успешного получения данных с сервера
  
  formValidError: boolean = true // Статус ошибки валидации формы перед отправкой

  errServ: boolean = false // Статус ошибки передачи данных формы на сервер

  receivedFormQuestion: OrdersInt // Данные заказа из формы questionForm, полученные с сервера

  questionForm : FormGroup // Объект FormGroup для формы questionForm

  loading = false // Переключатель индикатора загрузки ответа формы

  constructor(private formsService: FormsService) { 

    // Слушаем стрим для получения клика по кнопке открытия окна с формой
    this.clicksSub = formsService.observableclicks$.subscribe((data: ClickInt) => {
      if (data.typeofform == 5) {
        this.modal_switcher = true
      }      
    }) 

    // Валидация формы
    this.questionForm = new FormGroup({
      userPhone: new FormControl('', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(20),
        FormValidators.userPhone
      ]),
      userText: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
        FormValidators.userText
      ]),
      userEmail: new FormControl('', Validators.email)  
    })
  }

  // Закрытие формы кликами мыши
  closeForm() {
    this.modal_switcher = false // Закрываем модальное окно с формой
    this.switcher = false // Сбрасываем индикатор успешного получения данных с сервера
    this.errServ = false // Сбрасываем ошибку работы с сервером 
    this.formValidError = true // Сбрасываем ошибки валидации формы  
    this.switcher_valid = false // Сбрасываем индикатор валидации формы после клика на кнопку "Отправить заказ"
  }  

  // Закрытие формы кнопкой ESC
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27) { // 27===ESC
      this.closeForm()
    }
  }

  submitQuestion() {  
    this.errServ = false // Сбрасываем ошибку работы с сервером 
    this.switcher_valid = true // Кнопка отправки нажата, но форма не прошла валидацию 

    // Проверяем валидность формы перед отправкой
    if (this.questionForm.invalid) {   
      return
    }    

    // Заполнение отправляемого на сервер объекта данными из формы
    const formQuestion = {
      typeofact: 'Задать вопрос', 
      phone: this.questionForm.value.userPhone,
      email: this.questionForm.value.userEmail,
      text: this.questionForm.value.userText,
      typeofform: 5,
      status: false
    }

    this.loading = true // Включаем отображение индикатора загрузки
    this.switcher = true // Включаем показ окна с индикатором загрузки и результатом отправки формы 

    // Отправка оъекта на сервер и получение ответа от сервера
    this.servRespSub = this.formsService.postForm(formQuestion)      
      .subscribe(
        (data: OrdersInt) => {
          this.receivedFormQuestion = data // Получаем данные с сервера
          this.formValidError = false // Отключаем проверку ошибок валидации для формы
          this.switcher_valid = false // Отключаем вызов проверки ошибок по нажатию кнопки "Отправить заказ"              
          this.loading = false // Выключаем отображение индикатора загрузки    
          this.questionForm.reset() // Очищаем значения успешно отправленной формы                        
        },
        error => {
          this.errServ = true // Включаем статус ошибки передачи данных формы на сервер
          this.loading = false // Выключаем отображение индикатора загрузки              
        }
      )      
  }

  ngOnDestroy() {
    // удаляем подписку на продолжение получения кликов по кнопке открытия формы
    if (this.clicksSub) {
      this.clicksSub.unsubscribe()
    }

    // удаляем подписку на продолжение получения ответа сервера
    if (this.servRespSub) {
      this.servRespSub.unsubscribe()
    }

  }

}
