require_dependency "dash_creator/application_controller"

module DashCreator
  class ChartController < ApplicationController
    skip_before_action :verify_authenticity_token
    
    def create_chart
      return render json: {models: nil} if params[:filters].nil?

      # Remove useless filters from data
      chart_data = params
      chart_data[:filters] = chart_data[:filters]
                                 .to_unsafe_h
                                 .select { |key, value| chart_data[:y_data].include?(key.to_s) || (key.to_s == chart_data[:x_data][:attribute].classify && chart_data[:x_data][:from_filter] == 'true' ) }

      render 'dash_creator/chart/create_chart', locals: {chart_data: chart_data, filters_data: nil, id: 0}
    end

    def save_chart
      return render json: {models: nil} if params[:filters].nil?

      # Remove useless filters from data
      chart_data = params
      chart_data[:filters] = chart_data[:filters]
                                 .to_unsafe_h
                                 .select { |key, value| chart_data[:y_data].include?(key.to_s) || (key.to_s == chart_data[:x_data][:attribute].classify && chart_data[:x_data][:from_filter] == 'true' ) }

      # Create chart from data
      user = user_for_dash_creator
      chart = DashCreator::Chart.where(user_id: user.id).create(name: params[:chart_name], data: chart_data)

      render js: 'chart_id = ' + "'#{chart.id}'" + '; charts.push([' + "'#{params['chart_name']}'" + ', chart_id]);'
    end

    def edit_chart
      return render json: {models: nil} if params[:filters].nil?

      # Remove useless filters from data
      chart_data = params
      chart_data[:filters] = chart_data[:filters]
                                 .to_unsafe_h
                                 .select { |key, value| chart_data[:y_data].include?(key.to_s) || (key.to_s == chart_data[:x_data][:attribute].classify && chart_data[:x_data][:from_filter] == 'true' ) }

      # Edit chart from data
      user = user_for_dash_creator
      chart = DashCreator::Chart.where(user_id: user.id).find(params[:chart_id])
      chart.update_attribute(:data, chart_data)

      render json: {chart_id: chart.id}
    end

    def get_chart
      user = user_for_dash_creator
      id = params[:chart_id]
      chart = DashCreator::Chart.where(user_id: user.id).find(id)
      refresh = params.key?('refresh') ? params['refresh'] : 'false'

      filters_data = chart.data['filters']

      chart_data = chart.data
      chart_data['refresh'] = refresh
      chart_data.delete('chart_id')
      chart_data.delete('chart_name')

      render 'dash_creator/chart/create_chart', locals: {chart_data: chart.data, filters_data: filters_data, id: id}
    end

    def delete_charts
      user = user_for_dash_creator
      DashCreator::Chart.where(user_id: user.id).where(id: params[:charts_ids]).destroy_all
    end

    def pluck_labels
      model = params[:model].safe_constantize
      attribute = params[:attribute]
      limit = params[:limit].empty? ? 30 : params[:limit].to_i

      render json: {labels: model.pluck(:"#{attribute}").uniq.take(limit)}
    end
  end
end
