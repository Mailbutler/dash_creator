DashCreator::Engine.routes.draw do
  root to: 'user#creator'

  get '/creator', to: 'user#creator', as: :creator
  get '/dashboard/:dashboard_id', to: 'user#dashboard', as: :dashboard

  post '/get_filter', to: 'filter#get_filter', as: :get_filter
  post '/save_filter', to: 'filter#save_filter', as: :save_filter
  post '/delete_filters', to: 'filter#delete_filters', as: :delete_filters

  post '/filtering_result', to: 'filter#filtering_result', as: :filtering_result
  get '/download_csv', to: 'filter#download_csv', as: :download_csv

  post '/create_chart', to: 'chart#create_chart', as: :create_chart
  post '/save_chart', to: 'chart#save_chart', as: :save_chart
  post '/edit_chart', to: 'chart#edit_chart', as: :edit_chart
  post '/get_chart', to: 'chart#get_chart', as: :get_chart
  post '/delete_charts', to: 'chart#delete_charts', as: :delete_charts

  post '/pluck_labels', to: 'chart#pluck_labels', as: :pluck_labels

  post '/save_dashboard', to: 'dashboard#save_dashboard', as: :save_dashboard
  post '/edit_dashboard', to: 'dashboard#edit_dashboard', as: :edit_dashboard
  post '/get_dashboard', to: 'dashboard#get_dashboard', as: :get_dashboard
  post '/delete_dashboards', to: 'dashboard#delete_dashboards', as: :delete_dashboards

  post '/get_model_objects', to: 'dashboard_object#get_model_objects', as: :get_model_objects
end
